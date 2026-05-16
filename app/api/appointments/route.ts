import type { NextRequest } from "next/server";
import {
	errorResponse,
	getAuthenticatedUser,
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import { requireRole } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const user = await requireRole(["admin", "client", "worker"]);
		const { searchParams } = new URL(request.url);

		const date = searchParams.get("date");
		const status = searchParams.get("status");
		const workerId = searchParams.get("workerId");
		const clientId = searchParams.get("clientId");
		const hasPackage =
			searchParams.get("hasPackage") === "true" ? { not: null } : null;

		const where: any = {};
		let wId = workerId;

		if (workerId && user.role === "worker") {
			const w = await prisma.workerProfile.findUnique({
				where: { userId: user.id },
				cacheStrategy: {
					ttl: 60, // Fresh for 60 seconds
					swr: 30, // For another 30s, serve old data while updating in background
				},
			});
			if (!w) {
				return errorResponse("Worker not found for notification", 404);
			}
			wId = w.id;
		}

		// Role-based filtering
		if (user.role === "client") {
			where.clientId = clientId || user.clientProfile?.id;
			if (date) {
				where.date = new Date(date);
			}
			if (status) {
				where.status = status;
			}
			if (wId) {
				where.workerId = wId;
			}
		} else if (user.role === "worker") {
			const workerId = wId || user.workerProfile?.id;

			where.workerId = workerId;

			// where.OR = [
			//   {
			//     transfer: {
			//       originalWorkerId: workerId,
			//     },
			//   },
			//   {
			//     transfer: null,
			//   },
			// ];
			if (date) {
				where.date = new Date(date);
			}
			if (status) {
				where.status = status;
			}
			if (clientId) {
				where.clientId = clientId;
			}
		} else if (user.role === "admin") {
			if (date) {
				where.date = new Date(date);
			}
			if (status) {
				where.status = status;
			}
			if (wId) {
				where.workerId = wId;
			}
			if (clientId) {
				where.clientId = clientId;
			}
		}

		if (hasPackage !== null) {
			where.packageId = hasPackage;
		}

		const appointments = await prisma.appointment.findMany({
			where,
			include: {
				client: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								avatar: true,
							},
						},
					},
				},
				service: true,
				worker: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								avatar: true,
							},
						},
					},
				},
				paymentIntent: true,
				sale: {
					include: {
						payments: {
							select: {
								method: true,
								amount: true,
							},
						},
					},
				},
				transfer: {
					include: {
						newWorker: {
							include: {
								user: true,
							},
						},
						originalWorker: {
							include: {
								user: true,
							},
						},
					},
				},
				package: {
					include: {
						services: true,
					},
				},
			},
			orderBy: [{ date: "asc" }],
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		// console.log("Apps: ", { appointments })

		return successResponse(appointments);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser();
		const body = await request.json();

		let clientId =
			user.role === "client" ? user.clientProfile?.id : body.clientId;

		const {
			serviceId,
			workerId,
			date,
			time,
			location = "salon",
			addOns = [],
			notes,
			isPrepaidUsed,
			isGiftCardUsed,
			isFreeServiceUsed,
			refBonusApplied,
			paymentIntentId,
			paymentInfo = {},
			receiptUrl,
		} = body;

		// console.log("Received appointment creation request with data:", body);

		// Only clients and admins can create appointments
		if (!["client", "admin"].includes(user.role)) {
			return errorResponse(
				"Only clients and administrators can create appointments",
				403,
			);
		}

		// If admin is creating appointment for another client
		if (user.role === "admin" && body.clientId) {
			const clientExists = await prisma.clientProfile.findUnique({
				where: { id: body.clientId },
			});
			if (!clientExists) {
				return errorResponse("Client not found", 404);
			}
			clientId = body.clientId;
		} else if (user.role === "client") {
			// If client is creating appointment for themselves
			const client = await prisma.clientProfile.findUnique({
				where: { userId: user.id },
			});
			if (!client) {
				return errorResponse("Client not found", 404);
			}
			clientId = client.id;
		}

		// Validation
		if (!serviceId || !workerId || !date || !time || !clientId) {
			return errorResponse("Missing data", 400);
		}
		// Get service details
		const service = await prisma.service.findUnique({
			where: { id: serviceId },
		});
		if (!service) {
			return errorResponse("Service not found", 404);
		}

		// Check for conflicts
		const conflictingAppointment = await prisma.appointment.findFirst({
			where: {
				workerId,
				date: new Date(date),
				time,
				status: {
					in: ["confirmed", "in_progress"],
				},
			},
		});
		if (conflictingAppointment) {
			return errorResponse(
				"This time slot is already booked for another appointment",
				409,
			);
		}

		// Calculate total price including
		let totalPrice = service.price;
		let additionalTime = 0;

		if (addOns.length > 0) {
			const addOnsData = await prisma.serviceAddOn.findMany({
				where: {
					id: { in: addOns },
					serviceId: serviceId,
				},
			});

			const addOnsTotal = addOnsData.reduce(
				(sum, addOn) => sum + addOn.price,
				0,
			);
			additionalTime = addOnsData.reduce(
				(sum, addOn) => sum + addOn.duration,
				0,
			);
			totalPrice += addOnsTotal;
		}

		// Validate discount code if provided
		let discountAmount = 0;
		let discountCodeUsed = null;
		if (paymentInfo.discountCode) {
			const discount = await prisma.discountCode.findUnique({
				where: { code: paymentInfo.discountCode },
			});

			if (!discount || !discount.isActive || discount.endDate < new Date()) {
				return errorResponse("Invalid or expired discount code", 400);
			}

			if (
				discount.usedCount &&
				discount.usedCount >= (discount.maxUses || 1000)
			) {
				return errorResponse("Code usage limit reached", 400);
			}

			if (discount.value && totalPrice < discount.value) {
				return errorResponse(
					"Minimum amount required to use this code",
					400,
				);
			}

			discountCodeUsed = discount;
			if (discount.type === "percentage") {
				discountAmount = totalPrice * (discount.value / 100);
			} else {
				discountAmount = Math.min(discount.value, totalPrice);
			}
		}

		const wasRefBonusUsed = (amount: number) => {
			if (refBonusApplied) {
				return amount + amount * 0.1; // Add 10% back as bonus if ref bonus was applied
			}
			return amount;
		};

		// Calculate final total
		const taxAmount = paymentInfo.tax; // 16% tax
		const finalTotal = wasRefBonusUsed(
			isFreeServiceUsed
				? 0
				: totalPrice - discountAmount + taxAmount + (paymentInfo.tip || 0),
		);

		// console.log("Price calculation details:", {
		//   basePrice: service.price,
		//   addOnsTotal: totalPrice - service.price,
		//   discountAmount,
		//   taxAmount,
		//   finalTotal,
		// });

		// Create appointment in a single transaction
		const result = await prisma.$transaction(async (tx) => {
			// Create appointment
			let appointment;
			let transactionId = null;

			if (paymentIntentId && paymentInfo.method === "mobile") {
				const paymentIntent = await tx.paymentIntent.findFirst({
					where: { id: paymentIntentId, status: "success" },
					orderBy: { createdAt: "desc" },
				});
				if (!paymentIntent) throw new Error("NO PAYMENT MADE");

				transactionId = paymentIntent.transactionId;
				appointment = await tx.appointment.create({
					data: {
						date: new Date(date),
						time,
						location,
						price: finalTotal,
						duration: service.duration,
						client: { connect: { id: clientId } },
						worker: { connect: { id: workerId } },
						service: { connect: { id: serviceId } },
						paymentIntent: { connect: { id: paymentIntent.id } },
						notes,
						status: "confirmed",
						addOns,
					},
					include: {
						service: true,
						client: {
							include: {
								user: true,
							},
						},
						worker: {
							include: {
								user: true,
							},
						},
					},
				});
			} else {
				appointment = await tx.appointment.create({
					data: {
						date: new Date(date),
						time,
						location,
						price: finalTotal,
						duration: service.duration,
						client: { connect: { id: clientId } },
						worker: { connect: { id: workerId } },
						service: { connect: { id: serviceId } },
						notes,
						status: "confirmed",
						addOns,
					},
					include: {
						service: true,
						client: {
							include: {
								user: true,
							},
						},
						worker: {
							include: {
								user: true,
							},
						},
					},
				});
			}

			// Create sale record
			const sale = await tx.sale.create({
				data: {
					appointmentId: appointment.id,
					clientId,
					total: finalTotal,
					subtotal: totalPrice,
					discount: discountAmount,
					tax: taxAmount,
					tip: paymentInfo.tip || 0,
					paymentMethod: paymentInfo.method || "cash",
					paymentStatus: paymentInfo.status || "pending",
					discountCode: paymentInfo.discountCode || null,
					receiptNumber: `RCT-${Date.now()}`,
					notes: paymentInfo.notes || "",
				},
			});
			const addOnsData = await tx.serviceAddOn.findMany({
				where: {
					id: { in: addOns },
					serviceId: serviceId,
				},
			});
			// Create sale items
			const saleItemData = [
				{
					saleId: sale.id,
					serviceId: serviceId,
					quantity: 1,
					price: service.price,
					discount: 0,
				},
				...addOns.map((addOnId: any) => {
					const addOn = addOnsData.find((a) => a.id === addOnId);
					return {
						saleId: sale.id,
						serviceId: serviceId,
						quantity: 1,
						price: addOn?.price || 0,
						discount: 0,
					};
				}),
			];

			await tx.saleItem.createMany({
				data: saleItemData,
			});

			// Update discount code usage count
			if (discountCodeUsed) {
				await tx.discountCode.update({
					where: { code: paymentInfo.discountCode },
					data: {
						usedCount: {
							increment: 1,
						},
					},
				});
			}

			// Create payment record
			const payment = await tx.payment.create({
				data: {
					amount: finalTotal,
					method: paymentInfo.method || "cash",
					status: paymentInfo.status || "pending",
					saleId: sale.id,
					transactionId: transactionId || null,
				},
			});

			await tx.appointment.update({
				where: { id: appointment.id },
				data: {
					price: finalTotal,
					duration: { increment: additionalTime },
				},
			});

			// Update client loyalty points
			const loyaltyPointsEarned = Math.floor(finalTotal / 1000); // 1 point per 1000 CDF
			const clientUpdateData: any = {};

			const clientToUpdate = await tx.clientProfile.findUnique({
				where: { id: clientId },
				select: {
					prepaymentBalance: true,
					giftCardBalance: true,
				},
			});

			if (
				clientToUpdate &&
				isPrepaidUsed &&
				clientToUpdate.prepaymentBalance < appointment.price
			)
				throw new Error("Prepaid balance is insufficient.");
			if (
				clientToUpdate &&
				isGiftCardUsed &&
				clientToUpdate.giftCardBalance < appointment.price
			)
				throw new Error("Gift card balance is insufficient.");

			if (isPrepaidUsed) {
				clientUpdateData.data = {
					// loyaltyPoints: {
					//   increment: loyaltyPointsEarned,
					// },
					prepaymentBalance: {
						decrement: finalTotal,
					},
					totalSpent: {
						increment: finalTotal,
					},
					loyaltyTransactions: {
						create: {
							points: loyaltyPointsEarned,
							type: "earned_appointment",
							description: `Bonus for booking ${service.name} and you used your prepaid balance`,
						},
					},
				};
				// console.log("Client update data for free service:", clientUpdateData.data)
			} else if (isGiftCardUsed) {
				clientUpdateData.data = {
					// loyaltyPoints: {
					//   increment: loyaltyPointsEarned,
					// },
					giftCardBalance: {
						decrement: finalTotal,
					},
					totalSpent: {
						increment: finalTotal,
					},
					giftCardCount: {
						decrement: 1,
					},
					loyaltyTransactions: {
						create: {
							points: loyaltyPointsEarned,
							type: "earned_appointment",
							description: `Bonus for booking ${service.name} and you used your gift card`,
						},
					},
				};
				// console.log("Client update data for free service:", clientUpdateData.data)
			} else if (isFreeServiceUsed) {
				clientUpdateData.data = {
					// loyaltyPoints: {
					//   increment: loyaltyPointsEarned,
					// },
					freeServiceCount: {
						decrement: 1,
					},
					totalSpent: {
						increment: finalTotal,
					},
					loyaltyTransactions: {
						create: {
							points: loyaltyPointsEarned,
							type: "earned_appointment",
							description: `Bonus for booking ${service.name} and you used your free service`,
						},
					},
				};
				// console.log("Client update data for free service:", clientUpdateData.data)
			} else {
				clientUpdateData.data = {
					// loyaltyPoints: {
					//   increment: loyaltyPointsEarned,
					// },
					totalSpent: {
						increment: finalTotal,
					},
					loyaltyTransactions: {
						create: {
							points: loyaltyPointsEarned,
							type: "earned_appointment",
							description: `Bonus for booking ${service.name}`,
						},
					},
				};
				// console.log("Client update data :", clientUpdateData.data)
			}

			if (paymentInfo.method === "mobile") {
				clientUpdateData.data.prepaymentBalance = {
					decrement: finalTotal,
				};
			}

			const updateClient = await tx.clientProfile.update({
				where: { id: clientId },
				data: clientUpdateData.data,
				select: {
					userId: true,
				},
			});

			// 1. Définir les valeurs par défaut (pour cash, mobile money, etc.)
			let notifTitle = "📅 Appointment Confirmed";
			let notifMessage = `Your appointment for ${service.name} on ${date.split("T")[0]} at ${time} has been successfully created.`;

			// 2. Vérifier les méthodes spéciales pour personnaliser le message
			if (paymentInfo.method === "free-service") {
				notifTitle = "✨ Gift Appointment Confirmed!";
				notifMessage = `Congratulations! Your service "${service.name}" on ${date.split("T")[0]} at ${time} is fully offered as a reward for your loyalty. See you soon at Beauty Nails Salon!`;
			} else if (paymentInfo.method === "giftcard") {
				notifTitle = "🎁 Gift Card Payment";
				notifMessage = `Your appointment for "${service.name}" on ${date.split("T")[0]} at ${time} is confirmed. The payment was deducted from your Beauty Nails gift card.`;
			} else if (paymentInfo.method === "prepaid") {
				notifTitle = "💳 Prepaid Balance Used";
				notifMessage = `Your appointment for "${service.name}" on ${date.split("T")[0]} at ${time} has been paid and confirmed successfully using your prepaid balance.`;
			}

			// 3. Créer la notification avec les variables dynamiques
			await tx.notification.create({
				data: {
					userId: updateClient.userId,
					type: "appointment_created",
					title: notifTitle,
					message: notifMessage,
					link: `/dashboard/client?appointment=confirm&id=${appointment.id}`,
				},
			});

			// Create notification for worker
			await tx.notification.create({
				data: {
					userId: appointment.worker.user.id,
					type: "appointment_assigned",
					title: "New appointment assigned",
					message: `A new appointment for ${service.name} has been assigned to you on ${date.split("T")[0]} at ${time}.`,
					link: `/dashboard/worker?appointment=${appointment.id}`,
				},
			});

			// Create notification for admin (if applicable)
			const adminUser = await tx.user.findFirst({
				where: { role: "admin" },
			});

			if (adminUser) {
				await tx.notification.create({
					data: {
						userId: adminUser.id,
						type: "appointment_created",
						title: "New appointment created",
						message: `A new appointment for ${service.name} was created on ${date.split("T")[0]} at ${time}.`,
						link: `/dashboard/admin/appointments?appointment=${appointment.id}`,
					},
				});
			}

			return {
				appointment,
				sale,
				payment,
			};
		});

		// console.log("Result from appointment creation transaction:", {
		//   ...result,
		//   canGenerateReceipt: receiptUrl.length > 0 && paymentInfo.method === 'mobile',
		//   receiptUrl
		// });

		return successResponse({
			...result,
			canGenerateReceipt:
				receiptUrl.length > 0 && paymentInfo.method === "mobile",
			receiptUrl,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
