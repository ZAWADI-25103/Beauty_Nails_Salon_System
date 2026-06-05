"use server";

import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import { render } from "@react-email/render";
import { CommissionPaymentEmail } from "@/emails/CommissionPaymentEmail";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		// Only admin can approve/pay
		const currentUser = await requireRole(["admin", "worker"]);

		const body = await request.json();
		const sendEmailToWorker = body.sendEmail === true;

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

			if (body.status === "paid" && sendEmailToWorker && commission.worker.user.email) {
				try {
					const appointments = await prisma.appointment.findMany({
						where: {
							workerId: commission.workerId,
							status: "completed",
						},
						include: {
							service: { select: { name: true } },
							client: { include: { user: { select: { name: true } } } },
						},
						orderBy: { date: "desc" },
					});

					const html = await render(
						CommissionPaymentEmail({
							workerName: commission.worker.user.name,
							commissionPeriod: commission.period,
							commissionAmount: commission.commissionAmount,
							totalRevenue: commission.totalRevenue,
							businessEarnings: commission.totalRevenue - commission.commissionAmount,
							appointmentsCount: appointments.length,
							paymentDate: new Date().toLocaleDateString("en-GB"),
						}),
					);

					await sendEmail(
						commission.worker.user.email,
						`Commission paid for ${commission.period}`,
						html,
					);
				} catch (emailError) {
					console.error("Failed to send commission email", emailError);
				}
			}

			return updatedCommission;
		});

		return successResponse(updated);
	} catch (error) {
		return handleApiError(error);
	}
}
