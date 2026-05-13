import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		// requireRole(["admin"])

		const reviews = await prisma.review.findMany({
			cacheStrategy: {
				ttl: 60,
			},
		});

		return successResponse(reviews);
	} catch (error) {
		return handleApiError(error);
	}
}
