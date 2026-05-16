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
			return errorResponse("Appointment not found", 404);
		}

		if (appointment.workerId !== user.workerProfile?.id) {
			return errorResponse(
				"You can only transfer your own appointments",
				403,
			);
		}

		// Verify new worker exists and is available
		const newWorker = await prisma.workerProfile.findUnique({
			where: { id: newWorkerId, isAvailable: true },
		});

		if (!newWorker) {
			return errorResponse("Worker not available", 400);
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
				"This worker already has an appointment at this time slot",
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
				title: "Appointment transfer request",
				message: `${user.name} wants to transfer an appointment for ${appointment.client?.user?.name} on ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
				link: `/dashboard/worker/appointments?transferId=${transfer.id}`,
			},
		});

		return successResponse({
			transfer,
			message: "Transfer request sent",
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
			return errorResponse("Transfer not found", 404);
		}

		// Only the new worker can accept/reject
		if (transfer.newWorkerId !== user.workerProfile?.id) {
			return errorResponse(
				"You can only respond to transfers addressed to you",
				403,
			);
		}

		if (transfer.status !== "pending") {
			return errorResponse("This transfer has already been processed", 400);
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
					title: "Transfer accepted",
					message: `${transfer.newWorker.user.name} accepted your transfer request for the appointment of ${transfer.appointment.client?.user?.name}`,
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
					title: "Transfer rejected",
					message: `${transfer.newWorker.user.name} rejected your transfer request`,
					link: `/dashboard/worker/appointments?id=${transfer.appointmentId}`,
				},
			});
		} else {
			return errorResponse("Invalid action", 400);
		}

		return successResponse({
			transfer: updatedTransfer,
			message: `Transfer ${action === "accept" ? "accepted" : "rejected"}`,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
