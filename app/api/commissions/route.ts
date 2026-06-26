

import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		await requireRole(["worker", "admin"]);

		const body = await request.json();
		const { workerId, period } = body;

		if (!workerId) {
			throw new Error("workerId is required");
		}

		const worker = await prisma.workerProfile.findUnique({
			where: { id: workerId },
			include: { user: true },
		});

		if (!worker) {
			throw new Error("Worker not found");
		}

		const lastPaidAt = worker.lastCommissionPaidAt ?? worker.createdAt;
		const initializedCommissions = await prisma.commission.findMany({
			where: {
				workerId,
				commissionInitializedAtAppointmentCompletion: true,
				createdAt: {
					gt: lastPaidAt,
				},
			},
			orderBy: { createdAt: "asc" },
		});

		if (!initializedCommissions.length) {
			throw new Error("No initialized commissions are available to request yet");
		}

		const totalRevenue = initializedCommissions.reduce(
			(sum, commission) => sum + commission.totalRevenue,
			0,
		);
		const appointmentsCount = initializedCommissions.reduce(
			(sum, commission) => sum + commission.appointmentsCount,
			0,
		);
		const commissionAmount = initializedCommissions.reduce(
			(sum, commission) => sum + commission.commissionAmount,
			0,
		);
		const businessEarnings = initializedCommissions.reduce(
			(sum, commission) => sum + commission.businessEarnings,
			0,
		);
		const materialsCost = initializedCommissions.reduce(
			(sum, commission) => sum + commission.materialsCost,
			0,
		);
		const operationalCost = initializedCommissions.reduce(
			(sum, commission) => sum + commission.operationalCost,
			0,
		);
		const payoutPeriod =
			period || `payout-${new Date().toISOString().slice(0, 10)}`;

		const existing = await prisma.commission.findUnique({
			where: {
				workerId_period: {
					workerId,
					period: payoutPeriod,
				},
			},
		});

		if (existing) {
			throw new Error("Commission already generated for this period");
		}

		const commission = await prisma.$transaction(async (tx) => {
			const created = await tx.commission.create({
				data: {
					workerId,
					period: payoutPeriod,
					totalRevenue,
					appointmentsCount,
					commissionRate: worker.commissionRate ?? 0,
					commissionAmount,
					businessEarnings,
					materialsCost,
					operationalCost,
					commissionInitializedAtAppointmentCompletion: false,
					status: "pending",
				},
			});

			await tx.workerProfile.update({
				where: { id: workerId },
				data: { lastCommissionPaidAt: new Date() },
			});

			await tx.commission.updateMany({
				where: {
					workerId,
					commissionInitializedAtAppointmentCompletion: true,
					createdAt: {
						gt: lastPaidAt,
					},
				},
				data: { status: "approved" },
			});

			return created;
		});

		const admin = await prisma.user.findFirst({
			where: { role: "admin" },
		});
		const adminId = admin?.id;

		const workerName = worker.user.name || "Employee";

		await prisma.notification.create({
			data: {
				user: {
					connect: { id: adminId! },
				},
				type: "system",
				title: "Payment Request",
				message: `Worker ${workerName} requests payment for ${period}`,
				link: `/dashboard/admin?workerId=${workerId}&commissionId=${commission.id}`,
			},
		});

		await prisma.notification.create({
			data: {
				user: {
					connect: { id: worker.userId },
				},
				type: "system",
				title: "Payment Request",
				message: `Your payment request for ${period} has been created. Please wait for admin approval.`,
				link: `/dashboard/worker?workerId=${workerId}&commissionId=${commission.id}`,
			},
		});

		return successResponse(commission);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin", "worker", "client"]);

		const { searchParams } = new URL(request.url);
		const workerId = searchParams.get("workerId");

		const commissions = await prisma.commission.findMany({
			where: {
				commissionInitializedAtAppointmentCompletion: workerId ? true : false,
				...(workerId ? { workerId } : {}),
			},
			include: {
				worker: {
					include: { user: true },
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		console.log(commissions)

		return successResponse(commissions);
	} catch (error) {
		return handleApiError(error);
	}
}
