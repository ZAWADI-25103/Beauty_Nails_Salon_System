import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		requireRole(["admin", "worker", "client"]);

		const payments = await prisma.payment.findMany({
			orderBy: {
				createdAt: "asc",
			},
			cacheStrategy: {
				ttl: 60,
			},
		});

		if (!payments) return errorResponse("no payments");

		return successResponse(payments);
	} catch (error) {
		return handleApiError(error);
	}
}
