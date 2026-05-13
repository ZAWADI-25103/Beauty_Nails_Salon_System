"use server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
				throw new Error("Rendez-vous introuvable");
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
						"Impossible de démarrer : vous avez déjà une prestation en cours. Terminez-la d'abord.",
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
						"Ce client est déjà en cours de prestation avec un autre rendez-vous.",
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
						description: `Points gagnés pour avoir terminer le service ${updatedAppointment.service.name}`,
						relatedId: updatedAppointment.id,
					},
				});

				await tx.notification.create({
					data: {
						userId: updatedAppointment.client.userId,
						type: "loyalty_reward",
						title: "Points de fidélité",
						message: "Vous avez gagné 5 points de fidélité !",
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
						totalRevenue: updatedAppointment.price,
						period: `${format(
							new Date(updatedAppointment.date),
							"EEEE d MMMM 'à' HH'h'mm",
							{ locale: fr },
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
						updatedAppointment.transfer.transferFeeAmount;
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
									period: format(updatedAppointment.date, "yyyy-MM"),
								},
							},
							update: {
								totalRevenue: { increment: originalWorkerCommission },
								appointmentsCount: { increment: 1 },
							},
							create: {
								workerId: updatedAppointment.transfer.originalWorkerId,
								period: format(updatedAppointment.date, "yyyy-MM"),
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
									period: format(updatedAppointment.date, "yyyy-MM"),
								},
							},
							update: {
								totalRevenue: { increment: newWorkerCommission },
								appointmentsCount: { increment: 1 },
							},
							create: {
								workerId: updatedAppointment.transfer.newWorkerId,
								period: format(updatedAppointment.date, "yyyy-MM"),
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
			message: "Statut mis à jour",
			appointment: result,
		});
	} catch (error: any) {
		return handleApiError(error);
	}
}
