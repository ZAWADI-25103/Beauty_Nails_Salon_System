"use server";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		await requireRole(["admin", "worker"]);

		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "weekly";

		// Get worker profile
		const worker = await prisma.workerProfile.findUnique({
			where: { id },
		});

		if (!worker) {
			return errorResponse("Worker not found", 404);
		}

		// Calculate date range based on period
		const now = new Date();
		const startDate = new Date();

		if (worker.commissionFrequency === "weekly") {
			startDate.setDate(now.getDate() - now.getDay()); // Start of current week
		} else if (worker.commissionFrequency === "monthly") {
			startDate.setDate(1); // Start of current month
		} else if (worker.commissionFrequency === "daily") {
			startDate.setDate(now.getDate()); // Start of today
		}

		const commissions = await prisma.commission.findMany({
			where: {
				workerId: id,
				createdAt: {
					gte: startDate,
				},
			},
		});

		const totalEarnings = commissions.reduce(
			(sum, c) => sum + c.commissionAmount,
			0,
		);
		const totalBusiness = commissions.reduce((sum, c) => {
			const buzRate = 100 - c.commissionRate;
			const buzEarnings = (c.totalRevenue * buzRate) / 100;

			return sum + buzEarnings;
		}, 0);
		const totalRevenue = commissions.reduce(
			(sum, c) => sum + c.totalRevenue,
			0,
		);
		const matCost = totalBusiness * 0.5;
		const operaCost = totalBusiness * 0.5;
		const appointmentsCount = commissions.reduce(
			(sum, c) => sum + c.appointmentsCount,
			0,
		);

		console.log({
			commission: totalEarnings,
			totalBusiness,
			matCost,
			operaCost,
			totalRevenue,
			appointmentsCount,
			period,
			startDate: startDate.toISOString(),
			endDate: now.toISOString(),
		})

		return successResponse({
			commission: totalEarnings,
			totalBusiness: totalBusiness - matCost - operaCost,
			matCost,
			operaCost,
			totalRevenue,
			appointmentsCount,
			period,
			startDate: startDate.toISOString(),
			endDate: now.toISOString(),
		});
	} catch (error) {
		return handleApiError(error);
	}
}
