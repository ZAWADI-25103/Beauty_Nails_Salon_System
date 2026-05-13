import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

// PATCH: Accept or reject a transfer request
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await requireRole(["worker", "admin"]);
		const { id } = await params;
		const { action, notes } = await request.json(); // action: 'accept' | 'reject'

		const workerProfile = await prisma.workerProfile.findUnique({
			where: { userId: user.id },
		});

		if (!workerProfile) {
			return errorResponse("Profil employé non trouvé", 404);
		}

		const transfer = await prisma.appointmentTransfer.findUnique({
			where: { id },
			include: {
				appointment: {
					include: {
						client: { include: { user: true } },
						service: true,
					},
				},
				originalWorker: { include: { user: true } },
			},
		});

		if (!transfer) {
			return errorResponse("Transfert non trouvé", 404);
		}

		// Verify this worker is the intended recipient
		if (transfer.newWorkerId !== workerProfile.id) {
			return errorResponse(
				"Vous ne pouvez répondre qu'à vos propres demandes de transfert",
				403,
			);
		}

		if (transfer.status !== "pending") {
			return errorResponse("Ce transfert a déjà été traité", 400);
		}

		let result;

		if (action === "accept") {
			// Transaction: Update appointment AND mark transfer as accepted
			result = await prisma.$transaction(async (tx) => {
				// 1. Reassign appointment to new worker
				const updatedAppointment = await tx.appointment.update({
					where: { id: transfer.appointmentId },
					data: { workerId: transfer.newWorkerId },
				});

				// 2. Update transfer status
				const updatedTransfer = await tx.appointmentTransfer.update({
					where: { id: transfer.id },
					data: {
						status: "accepted",
						completedAt: new Date(),
						notes: notes || null,
					},
				});

				return { appointment: updatedAppointment, transfer: updatedTransfer };
			});

			// Notify original worker
			await prisma.notification.create({
				data: {
					userId: transfer.originalWorker.userId,
					type: "appointment_transfer_accepted",
					title: "Transfert accepté ✓",
					message: `${user.name} a accepté votre demande de transfert pour le rendez-vous de ${transfer.appointment.client?.user?.name} (${transfer.appointment.service?.name})`,
					link: `/dashboard/worker/appointments?id=${transfer.appointmentId}`,
				},
			});
		} else if (action === "reject") {
			// Just update transfer status (appointment stays with original worker)
			result = await prisma.appointmentTransfer.update({
				where: { id: transfer.id },
				data: {
					status: "rejected",
					notes: notes || null,
				},
			});

			// Notify original worker
			await prisma.notification.create({
				data: {
					userId: transfer.originalWorker.userId,
					type: "appointment_transfer_rejected",
					title: "Transfert refusé ✗",
					message: `${user.name} a refusé votre demande de transfert pour ${transfer.appointment.client?.user?.name}`,
					link: `/dashboard/worker/appointments?id=${transfer.appointmentId}`,
				},
			});
		} else {
			return errorResponse(
				'Action invalide. Utilisez "accept" ou "reject"',
				400,
			);
		}

		return successResponse({
			transfer: result,
			message: action === "accept" ? "Transfert accepté" : "Transfert refusé",
		});
	} catch (error) {
		return handleApiError(error);
	}
}
