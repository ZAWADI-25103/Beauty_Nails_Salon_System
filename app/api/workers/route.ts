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

		const workers = await prisma.workerProfile.findMany({
			select: {
				id: true,
				specialties: true,
				user: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		if (!workers) return errorResponse("no workers");

		return successResponse(workers);
	} catch (error) {
		return handleApiError(error);
	}
}
