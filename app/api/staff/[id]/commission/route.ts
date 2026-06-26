import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

type CommissionFrequency = "daily" | "weekly" | "monthly";

function getStartDate(period: CommissionFrequency): Date {
	const now = new Date();

	switch (period) {
		case "daily":
			return new Date(now.getFullYear(), now.getMonth(), now.getDate());

		case "weekly": {
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			start.setDate(start.getDate() - start.getDay());
			return start;
		}

		case "monthly":
			return new Date(now.getFullYear(), now.getMonth(), 1);
	}
}

const MAT_COST_RATIO = 0.5;
const OPERA_COST_RATIO = 0.5;

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params;
		await requireRole(["admin", "worker"]);

		const worker = await prisma.workerProfile.findUnique({ where: { id } });
		if (!worker) return errorResponse("Worker not found", 404);

		const { searchParams } = new URL(request.url);
		const period = (searchParams.get("period") ?? worker.commissionFrequency) as CommissionFrequency;
		const startDate = getStartDate(period);
		const now = new Date();

		const commissions = await prisma.commission.findMany({
			where: {
				workerId: id,
			  createdAt: { gte: startDate },
		  },
	  });

		const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
		const totalRevenue = commissions.reduce((sum, c) => sum + c.totalRevenue, 0);
		const totalBusiness = commissions.reduce((sum, c) => {
		  return sum + (c.totalRevenue * (100 - c.commissionRate)) / 100;
	  }, 0);

		const matCost = totalBusiness * MAT_COST_RATIO;
		const operaCost = totalBusiness * OPERA_COST_RATIO;
		const appointmentsCount = commissions.reduce((sum, c) => sum + c.appointmentsCount, 0);

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