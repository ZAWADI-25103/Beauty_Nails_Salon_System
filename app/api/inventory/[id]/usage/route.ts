import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

// GET: Fetch detailed usage history for a specific inventory item
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireRole(["admin", "worker"]);
		const { id } = await params;

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		const where: any = { itemId: id };
		if (startDate) where.createdAt = { gte: new Date(startDate) };
		if (endDate)
			where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

		const usages = await prisma.inventoryUsage.findMany({
			where,
			include: {
				item: {
					select: {
						name: true,
						unit: true,
						category: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Aggregate usage statistics
		const totalUsed = usages.reduce((sum, u) => sum + u.quantity, 0);
		const uniqueAppointments = new Set(usages.map((u) => u.usedFor)).size;
		const uniqueWorkers = new Set(usages.map((u) => u.usedBy)).size;

		return successResponse({
			usages,
			stats: {
				totalUsed,
				uniqueAppointments,
				uniqueWorkers,
				averagePerAppointment:
					uniqueAppointments > 0 ? totalUsed / uniqueAppointments : 0,
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
