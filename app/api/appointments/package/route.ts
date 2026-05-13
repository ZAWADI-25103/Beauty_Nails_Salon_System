import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const user = await requireRole(["client", "admin"]);
		const body = await request.json();

		const clientId =
			user.role === "client" ? user.clientProfile?.id : body.clientId;

		const {
			packageId,
			workerId,
			date,
			time,
			location = "salon",
			addOns = [], // Add-ons are separate from package
			notes,
			paymentInfo = {},
			paymentIntentId,
		} = body;

		// Validation
		if (!packageId || !workerId || !date || !time || !clientId) {
			return errorResponse("Données manquantes", 400);
		}

		// Get package details with included services
		const servicePackage = await prisma.servicePackage.findUnique({
			where: { id: packageId, isActive: true },
			include: {
				services: true,
			},
		});

		if (!servicePackage) {
			return errorResponse("Forfait non trouvé ou inactif", 404);
		}

		// Calculate total duration (sum of all services in package + add-ons)
		const packageDuration = servicePackage.services.reduce(
			(sum, service) => sum + service.duration,
			0,
		);

		// Get add-ons data if any
		let addOnsDuration = 0;
		let addOnsTotal = 0;

		if (addOns.length > 0) {
			// Get add-ons from the first service in package (or you could allow add-ons per service)
			const firstServiceId = servicePackage.services[0]?.id;

			if (firstServiceId) {
				const addOnsData = await prisma.serviceAddOn.findMany({
					where: {
						id: { in: addOns },
						serviceId: firstServiceId,
					},
				});

				addOnsDuration = addOnsData.reduce(
					(sum, addOn) => sum + addOn.duration,
					0,
				);
				addOnsTotal = addOnsData.reduce((sum, addOn) => sum + addOn.price, 0);
			}
		}

		const totalDuration = packageDuration + addOnsDuration;

		// Calculate final price: package price (already discounted) + add-ons
		const packagePrice = servicePackage.price;
		const totalPrice = packagePrice + addOnsTotal;

		// Validate discount code if provided (optional, separate from package discount)
		let discountAmount = 0;
		let discountCodeUsed = null;

		if (paymentInfo.discountCode) {
			const discount = await prisma.discountCode.findUnique({
				where: { code: paymentInfo.discountCode },
			});

			if (!discount || !discount.isActive || discount.endDate < new Date()) {
				return errorResponse("Code de réduction invalide ou expiré", 400);
			}

			if (
				discount.usedCount &&
				discount.usedCount >= (discount.maxUses || 1000)
			) {
				return errorResponse("Limite d'utilisation du code atteinte", 400);
			}

			if (discount.minPurchase && totalPrice < Number(discount.minPurchase)) {
				return errorResponse(
					"Montant minimum requis pour utiliser ce code",
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

		// Calculate final total with tax
		const taxAmount = (totalPrice - discountAmount) * 0.16; // 16% tax
		const finalTotal =
			totalPrice - discountAmount + taxAmount + (paymentInfo.tip || 0);

		// Create everything in a single transaction
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

				// 1. Create appointment linked to package
				appointment = await tx.appointment.create({
					data: {
						client: {
							connect: { id: clientId },
						},
						worker: {
							connect: { id: workerId },
						},
						service: {
							connect: { id: servicePackage.services[0].id },
						},
						paymentIntent: { connect: { id: paymentIntent.id } },
						date: new Date(date),
						time,
						duration: totalDuration,
						price: finalTotal,
						location,
						notes,
						addOns,
						status: "confirmed",
						package: {
							connect: { id: packageId },
						},
					},
					include: {
						package: true,
						client: { include: { user: true } },
						worker: { include: { user: true } },
					},
				});

				transactionId = paymentIntent.transactionId;
			} else {
				// 1. Create appointment linked to package
				appointment = await tx.appointment.create({
					data: {
						client: {
							connect: { id: clientId },
						},
						worker: {
							connect: { id: workerId },
						},
						service: {
							connect: { id: servicePackage.services[0].id },
						},
						date: new Date(date),
						time,
						duration: totalDuration,
						price: finalTotal,
						location,
						notes,
						addOns,
						status: "confirmed",
						package: {
							connect: { id: packageId },
						},
					},
					include: {
						package: true,
						client: { include: { user: true } },
						worker: { include: { user: true } },
					},
				});
			}

			// 2. Create sale record
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

			// 3. Create sale items for EACH service in the package
			// We distribute the package price proportionally or use service prices with package discount applied
			const packageDiscountRate =
				servicePackage.discount > 0 ? servicePackage.discount / 100 : 0;

			const saleItemsData = servicePackage.services.map((service) => {
				// Apply package discount to each service price for reporting
				const discountedPrice = service.price * (1 - packageDiscountRate);

				return {
					saleId: sale.id,
					serviceId: service.id,
					quantity: 1,
					price: discountedPrice,
					discount: service.price - discountedPrice,
				};
			});

			// Add add-ons as separate sale items
			if (addOns.length > 0 && servicePackage.services[0]) {
				const addOnsData = await tx.serviceAddOn.findMany({
					where: {
						id: { in: addOns },
						serviceId: servicePackage.services[0].id,
					},
				});

				addOnsData.forEach((addOn) => {
					saleItemsData.push({
						saleId: sale.id,
						serviceId: addOn.id, // Add-ons are linked to their base service
						quantity: 1,
						price: addOn.price,
						discount: 0,
					});
				});
			}

			await tx.saleItem.createMany({
				data: saleItemsData,
			});

			// 4. Update discount code usage if used
			if (discountCodeUsed) {
				await tx.discountCode.update({
					where: { code: paymentInfo.discountCode },
					data: {
						usedCount: { increment: 1 },
					},
				});
			}

			// 5. Create payment record
			await tx.payment.create({
				data: {
					amount: finalTotal,
					method: paymentInfo.method || "cash",
					status: paymentInfo.status || "pending",
					saleId: sale.id,
					transactionId: paymentInfo.transactionId || null,
				},
			});

			// 6. Update client loyalty points (based on final total)
			const loyaltyPointsEarned = Math.floor(finalTotal / 1000); // 1 point per 1000 CDF

			await tx.clientProfile.update({
				where: { id: clientId },
				data: {
					totalSpent: { increment: finalTotal },
					loyaltyTransactions: {
						create: {
							points: loyaltyPointsEarned,
							type: "earned_appointment",
							description: `Bonus pour avoir réservé le forfait "${servicePackage.name}"`,
						},
					},
				},
				select: { userId: true },
			});

			// 7. Create notifications
			const appointmentWithRelations = await tx.appointment.findUnique({
				where: { id: appointment.id },
				include: {
					client: { include: { user: true } },
					worker: { include: { user: true } },
				},
			});

			if (!appointmentWithRelations) {
				throw new Error("Appointment not found for notifications");
			}

			// For client
			await tx.notification.create({
				data: {
					userId: appointmentWithRelations.client.user.id,
					type: "appointment_created",
					title: "Forfait réservé avec succès !",
					message: `Votre forfait "${servicePackage.name}" est confirmé pour le ${new Date(date).toLocaleDateString("fr-FR")} à ${time}.`,
					link: `/dashboard/client?appointment=confirm&id=${appointment.id}`,
				},
			});

			// For worker
			await tx.notification.create({
				data: {
					userId: appointmentWithRelations.worker.user.id,
					type: "appointment_assigned",
					title: "Nouveau forfait assigné",
					message: `Un nouveau forfait "${servicePackage.name}" a été assigné à vous le ${new Date(date).toLocaleDateString("fr-FR")} à ${time}.`,
					link: `/dashboard/worker?appointment=${appointment.id}`,
				},
			});

			// For admin
			const adminUser = await tx.user.findFirst({ where: { role: "admin" } });
			if (adminUser) {
				await tx.notification.create({
					data: {
						userId: adminUser.id,
						type: "appointment_created",
						title: "Nouveau forfait réservé",
						message: `Un nouveau forfait "${servicePackage.name}" a été réservé le ${new Date(date).toLocaleDateString("fr-FR")} à ${time}.`,
						link: `/dashboard/admin/appointments?appointment=${appointment.id}`,
					},
				});
			}

			return { appointment, sale };
		});

		return successResponse({
			...result,
			message: "Forfait réservé avec succès",
		});
	} catch (error) {
		return handleApiError(error);
	}
}
