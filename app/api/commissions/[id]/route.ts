"use server";

import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		// Only admin can approve/pay
		const currentUser = await requireRole(["admin", "worker"]);

		const body = await request.json();

		const commission = await prisma.commission.findUnique({
			where: { id },
			include: {
				worker: {
					include: { user: true },
				},
			},
		});

		if (!commission) {
			throw new Error("Commission not found");
		}

		if (commission.status === "paid")
			return errorResponse("This commission has already been paid");

		const updated = await prisma.$transaction(async (tx) => {
			// 1️⃣ Update worker commission
			const updatedCommission = await tx.commission.update({
				where: { id },
				data: {
					status: body.status,
					paidAt: body.status === "paid" ? new Date() : undefined,
				},
			});

			// 2️⃣ Calculate employer share
			const employerAmount =
				commission.totalRevenue - commission.commissionAmount;

			// 3️⃣ Notify worker
			await tx.notification.create({
				data: {
					userId: commission.worker.userId,
					type: "payment_received",
					title: "Payment Approved",
					message: `Your commission for ${commission.period} has been paid (${commission.commissionAmount} CDF).`,
					link: `/dashboard/worker?commissionId=${commission.id}`,
				},
			});

			// 4️⃣ Notify admin (confirmation log)
			await tx.notification.create({
				data: {
					userId: currentUser.id,
					type: "system",
					title: "Commission Paid",
					message: `Payment made for ${commission.worker.user.name}. Admin revenue: ${employerAmount} CDF`,
				},
			});

			return updatedCommission;
		});

		return successResponse(updated);
	} catch (error) {
		return handleApiError(error);
	}
}
