import type { NextRequest } from "next/server";
import { handleApiError, successResponse } from "@/lib/api/helpers";
import { requireRole } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		// requireRole(["admin","client", "worker"])

		const medias = await prisma.media.findMany();

		return successResponse(medias);
	} catch (error) {
		return handleApiError(error);
	}
}
