
import type { NextRequest } from "next/server";
import {
	errorResponse,
	getAuthenticatedUser,
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		// context: { params: Promise<{ id: string; }>; }
		const id = (await context.params).id;
		const user = await getAuthenticatedUser();
		const body = await request.json();
		const { reason } = body;

		const appointment = await prisma.appointment.findUnique({
			where: { id, status: { not: "cancelled" } },
		});

		if (!appointment) {
			return errorResponse("Appointment not found", 404);
		}

		// Clients can only cancel their own appointments
		if (
			user.role === "client" &&
			appointment.clientId !== user.clientProfile?.id
		) {
			return errorResponse("Access denied", 403);
		}

		const updated = await prisma.appointment.update({
			where: { id },
			data: {
				status: "cancelled",
				cancelReason: reason,
			},
			include: {
				service: {
					select: {
						price: true,
						name: true,
					},
				},
			},
		});

		const userWorker = await prisma.workerProfile.findUnique({
			where: { id: appointment.workerId },
			include: { user: true },
		});
		const userClient = await prisma.clientProfile.update({
			where: { id: appointment.clientId },
			data: {
				// loyaltyPoints:{
				//   decrement: updated.service.price / 1000
				// },
				prepaymentBalance: {
					increment: appointment.price,
				},
				loyaltyTransactions: {
					create: {
						type: "earned_appointment",
						points: updated.service ? Math.round(updated.service.price / 1000) : 0,
						description: "loyalty points for canceled appointment",
					},
				},
			},
			include: { user: true },
		});

		if (!userWorker || !userClient) {
			return errorResponse("Worker not found for notification", 404);
		}

		// Send notification to worker
		await prisma.notification.create({
			data: {
				userId: userWorker?.user.id,
				type: "appointment_cancelled",
				title: "Appointment cancelled",
				message: `An appointment has been cancelled. Reason: ${reason}`,
				link: `/dashboard/worker?canceledAppointment=${updated.id}`,
			},
		});

		// Send notification to worker
		await prisma.notification.create({
			data: {
				userId: userClient?.user.id,
				type: "appointment_cancelled",
				title: "Appointment cancelled",
				message: `You canceled an appointment. Reason: ${reason}, If you initiated a payment, please contact customer service for a refund`,
				link: `/dashboard/client?canceledAppointment=${updated.id}`,
			},
		});

		return successResponse({
			message: "Appointment cancelled",
			appointment: updated,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
