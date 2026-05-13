import { format } from "date-fns";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

// GET: Get transfer info for an appointment
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireRole(["admin", "worker"]);
		const { id } = await params;

		const transfer = await prisma.appointmentTransfer.findUnique({
			where: { appointmentId: id },
			include: {
				appointment: {
					include: {
						client: { include: { user: true } },
						service: true,
						worker: { include: { user: true } },
					},
				},
				originalWorker: { include: { user: true } },
				newWorker: { include: { user: true } },
			},
		});

		return successResponse(transfer);
	} catch (error) {
		return handleApiError(error);
	}
}

// POST: Request a transfer
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await requireRole(["worker", "client", "admin"]);
		const { id } = await params;
		const body = await request.json();

		const { newWorkerId, transferReason, transferFeePercentage = 5.0 } = body;

		// Verify appointment exists and belongs to this worker
		const appointment = await prisma.appointment.findUnique({
			where: { id },
			include: { worker: true, client: { include: { user: true } } },
		});

		if (!appointment) {
			return errorResponse("Rendez-vous non trouvé", 404);
		}

		if (appointment.workerId !== user.workerProfile?.id) {
			return errorResponse(
				"Vous ne pouvez transférer que vos propres rendez-vous",
				403,
			);
		}

		// Verify new worker exists and is available
		const newWorker = await prisma.workerProfile.findUnique({
			where: { id: newWorkerId, isAvailable: true },
		});

		if (!newWorker) {
			return errorResponse("Employé non disponible", 400);
		}

		// Check for conflicts with new worker's schedule
		const conflict = await prisma.appointment.findFirst({
			where: {
				workerId: newWorkerId,
				date: appointment.date,
				time: appointment.time,
				status: { in: ["confirmed", "in_progress"] },
			},
		});

		if (conflict) {
			return errorResponse(
				"Cet employé a déjà un rendez-vous à ce créneau",
				409,
			);
		}

		// Calculate transfer fee
		const transferFeeAmount = (appointment.price * transferFeePercentage) / 100;

		// Create transfer request
		const transfer = await prisma.appointmentTransfer.create({
			data: {
				appointmentId: appointment.id,
				originalWorkerId: appointment.workerId,
				newWorkerId,
				transferReason,
				transferFeePercentage,
				transferFeeAmount,
				status: "pending",
			},
			include: {
				appointment: true,
				originalWorker: { include: { user: true } },
				newWorker: { include: { user: true } },
			},
		});

		// await prisma.appointment.update({
		//   where:{ id: appointment.id },
		//   data: {
		//     transfer: {
		//       connect: {
		//         id : transfer.id
		//       },
		//     },
		//     worker: {
		//       connect: {
		//         id: newWorkerId
		//       }
		//     }
		// }
		// })

		// Notify new worker
		await prisma.notification.create({
			data: {
				userId: newWorker.userId,
				type: "appointment_transfer_request",
				title: "Demande de transfert de rendez-vous",
				message: `${user.name} souhaite vous transférer un rendez-vous pour ${appointment.client?.user?.name} le ${appointment.date.toLocaleDateString()} à ${appointment.time}`,
				link: `/dashboard/worker/appointments?transferId=${transfer.id}`,
			},
		});

		return successResponse({
			transfer,
			message: "Demande de transfert envoyée",
		});
	} catch (error) {
		return handleApiError(error);
	}
}

// PATCH: Accept/reject transfer
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await requireRole(["worker", "client", "admin"]);
		const { id } = await params;
		const body = await request.json();

		const { action, notes } = body; // action: 'accept' or 'reject'

		const transfer = await prisma.appointmentTransfer.findUnique({
			where: { appointmentId: id },
			include: {
				appointment: {
					include: {
						client: {
							include: {
								user: true,
							},
						},
					},
				},
				originalWorker: { include: { user: true } },
				newWorker: { include: { user: true } },
			},
		});

		if (!transfer) {
			return errorResponse("Transfert non trouvé", 404);
		}

		// Only the new worker can accept/reject
		if (transfer.newWorkerId !== user.workerProfile?.id) {
			return errorResponse(
				"Vous ne pouvez répondre qu'aux transferts qui vous sont destinés",
				403,
			);
		}

		if (transfer.status !== "pending") {
			return errorResponse("Ce transfert a déjà été traité", 400);
		}

		let updatedTransfer;

		if (action === "accept") {
			// Update appointment to new worker
			updatedTransfer = await prisma.$transaction(async (tx) => {
				// Update appointment
				await tx.appointment.update({
					where: { id: transfer.appointmentId },
					data: { worker: { connect: { id: transfer.newWorkerId } } },
				});

				// Update transfer status
				const updated = await tx.appointmentTransfer.update({
					where: { appointmentId: transfer.appointmentId },
					data: {
						status: "accepted",
						completedAt: new Date(),
						notes,
					},
				});

				return updated;
			});

			// Notify original worker
			await prisma.notification.create({
				data: {
					userId: transfer.originalWorker.userId,
					type: "appointment_transfer_accepted",
					title: "Transfert accepté",
					message: `${transfer.newWorker.user.name} a accepté votre demande de transfert pour le rendez-vous de ${transfer.appointment.client?.user?.name}`,
					link: `/dashboard/worker/appointments?id=${transfer.appointmentId}`,
				},
			});
		} else if (action === "reject") {
			updatedTransfer = await prisma.$transaction(async (tx) => {
				const updated = await prisma.appointmentTransfer.update({
					where: { appointmentId: id },
					data: {
						status: "rejected",
						notes,
					},
				});

				// Update appointment
				// await tx.appointment.update({
				//   where: { id: transfer.appointmentId },
				//   data: { worker: { connect : { id: transfer.originalWorkerId }} }
				// });

				return updated;
			});

			// Notify original worker
			await prisma.notification.create({
				data: {
					userId: transfer.originalWorker.userId,
					type: "appointment_transfer_rejected",
					title: "Transfert refusé",
					message: `${transfer.newWorker.user.name} a refusé votre demande de transfert`,
					link: `/dashboard/worker/appointments?id=${transfer.appointmentId}`,
				},
			});
		} else {
			return errorResponse("Action invalide", 400);
		}

		return successResponse({
			transfer: updatedTransfer,
			message: `Transfert ${action === "accept" ? "accepté" : "refusé"}`,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
