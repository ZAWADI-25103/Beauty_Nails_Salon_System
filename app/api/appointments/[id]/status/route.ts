"use server";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		const user = await requireRole(["admin", "worker"]);

		const body = await request.json();
		const { status } = body;

		const result = await prisma.$transaction(async (tx) => {
			// 1️⃣ Get appointment first
			const appointment = await tx.appointment.findUnique({
				where: { id },
			});

			if (!appointment) {
				throw new Error("Appointment not found");
			}

			// 🚫 BLOCK if trying to start a new session
			if (status === "in_progress") {
				// Check worker
				const workerBusy = await tx.appointment.findFirst({
					where: {
						workerId: appointment.workerId,
						status: "in_progress",
						NOT: { id },
					},
				});

				if (workerBusy) {
					throw new Error(
						"Cannot start: you already have a service in progress. Please finish it first.",
					);
				}

				// Check client
				const clientBusy = await tx.appointment.findFirst({
					where: {
						clientId: appointment.clientId,
						status: "in_progress",
						NOT: { id },
					},
				});

				if (clientBusy) {
					throw new Error(
						"This client is already receiving service with another appointment.",
					);
				}
			}

			// 2️⃣ Update appointment AFTER validation
			const updatedAppointment = await tx.appointment.update({
				where: { id },
				data: { status },
				include: {
					client: { include: { user: true } },
					worker: true,
					service: true,
					transfer: {
						include: {
							newWorker: true,
						},
					},
				},
			});

			// 3️⃣ Handle completion logic
			if (status === "completed") {
				await tx.clientProfile.update({
					where: { id: updatedAppointment.clientId },
					data: {
						totalAppointments: { increment: 1 },
						totalSpent: { increment: updatedAppointment.price },
					},
				});

				await tx.loyaltyTransaction.create({
					data: {
						clientId: updatedAppointment.clientId,
						points: 5,
						type: "earned_appointment",
						description: `Points earned for completing the service ${updatedAppointment.service?.name}`,
						relatedId: updatedAppointment.id,
					},
				});

				await tx.notification.create({
					data: {
						userId: updatedAppointment.client.userId,
						type: "loyalty_reward",
						title: "Loyalty Points",
						message: "You earned 5 loyalty points!",
					},
				});

				const workerCommissionAmount =
					(updatedAppointment.price * user?.workerProfile?.commissionRate!) /
						100 || 0;
				let businessEarnings =
					updatedAppointment.price - workerCommissionAmount;
				const materialsCost = businessEarnings * 0.05; // 5% des revenus pour les matériaux
				const operationalCost = businessEarnings * 0.05; // 5% des revenus pour les coûts opérationnels
				businessEarnings = businessEarnings - materialsCost - operationalCost; // Reste pour le salon

				await tx.commission.create({
					data: {
						worker: { connect: { id: updatedAppointment.workerId } },
						appointmentsCount: 1,
						commissionAmount: workerCommissionAmount,
						commissionRate: user.workerProfile?.commissionRate ?? 0,
						status: "pending",
						commissionInitializedAtAppointmentCompletion: true,
						totalRevenue: updatedAppointment.price,
						period: `${format(
							new Date(updatedAppointment.date),
							"PPP 'at' HH:mm",
							{ locale: enUS },
						)}`,
						businessEarnings: businessEarnings,
						materialsCost: materialsCost,
						operationalCost: operationalCost,
					},
				});

				// After marking appointment as completed, handle transfer commission
				if (
					updatedAppointment.transfer &&
					updatedAppointment.transfer.status === "accepted"
				) {
					// Calculate commission distribution
					const originalWorkerCommission =
						updatedAppointment.price - updatedAppointment.transfer.transferFeeAmount;
					const newWorkerCommission =
						updatedAppointment.price *
						(1 - updatedAppointment.transfer.transferFeePercentage / 100);

					// Update commissions for both workers
					await prisma.$transaction([
						// Original worker gets reduced commission
						prisma.commission.upsert({
							where: {
								workerId_period: {
									workerId: updatedAppointment.transfer.originalWorkerId,
									period: format(updatedAppointment.date, "PPP 'at' HH:mm", { locale: enUS }),
								},
							},
							update: {
								totalRevenue: { increment: originalWorkerCommission },
								appointmentsCount: { increment: 1 },
							},
							create: {
								workerId: updatedAppointment.transfer.originalWorkerId,
								period: format(updatedAppointment.date, "PPP 'at' HH:mm", { locale: enUS }),
								totalRevenue: originalWorkerCommission,
								commissionRate: updatedAppointment.worker?.commissionRate || 0,
								commissionAmount:
									originalWorkerCommission *
									((updatedAppointment.worker?.commissionRate || 0) / 100),
								appointmentsCount: 1,
							},
						}),

						// New worker gets transfer fee as bonus
						prisma.commission.upsert({
							where: {
								workerId_period: {
									workerId: updatedAppointment.transfer.newWorkerId,
									period: format(updatedAppointment.date, "PPP 'at' HH:mm", { locale: enUS }),
								},
							},
							update: {
								totalRevenue: { increment: newWorkerCommission },
								appointmentsCount: { increment: 1 },
							},
							create: {
								workerId: updatedAppointment.transfer.newWorkerId,
								period: format(updatedAppointment.date, "PPP 'at' HH:mm", { locale: enUS }),
								totalRevenue: newWorkerCommission,
								commissionRate:
									updatedAppointment.transfer.newWorker?.commissionRate || 0,
								commissionAmount:
									newWorkerCommission *
									((updatedAppointment.transfer.newWorker?.commissionRate ||
										0) /
										100),
								appointmentsCount: 1,
							},
						}),

						// Mark transfer as completed
						prisma.appointmentTransfer.update({
							where: { appointmentId: updatedAppointment.id },
							data: { status: "completed" },
						}),
					]);
				}
			}

			return updatedAppointment;
		});

		return successResponse({
			message: "Status updated",
			appointment: result,
		});
	} catch (error: any) {
		return handleApiError(error);
	}
}
