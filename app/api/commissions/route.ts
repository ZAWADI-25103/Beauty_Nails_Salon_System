"use server";

import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		await requireRole(["worker", "admin", "client"]);

		const body = await request.json();
		const {
			workerId,
			period,
			totalRevenue,
			appointmentsCount,
			commissionRate,
		} = body;

		const existing = await prisma.commission.findUnique({
			where: {
				workerId_period: {
					workerId,
					period,
				},
			},
		});

		if (existing) {
			throw new Error("Commission already generated for this period");
		}

		const commissionAmount = totalRevenue * (commissionRate / 100);

		const commission = await prisma.commission.create({
			data: {
				workerId,
				period,
				totalRevenue,
				appointmentsCount,
				commissionRate,
				commissionAmount,
			},
		});

		const admin = await prisma.user.findFirst({
			where: { role: "admin" },
		});
		const adminId = admin?.id;

		const worker = await prisma.workerProfile.findUnique({
			where: { id: workerId },
			include: { user: true },
		});
		const workerName = worker?.user.name || "Employee";

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
					connect: { id: worker?.userId! },
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

export async function GET() {
	try {
		await requireRole(["admin", "worker", "client"]);

		const commissions = await prisma.commission.findMany({
			include: {
				worker: {
					include: { user: true },
				},
			},
			orderBy: {
				createdAt: "asc",
			},
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		// console.log(commissions)

		return successResponse(commissions);
	} catch (error) {
		return handleApiError(error);
	}
}
