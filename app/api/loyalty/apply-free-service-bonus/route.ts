import type { NextRequest } from "next/server";
import {
	errorResponse,
	getAuthenticatedUser,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
	try {
		// 1. Authorization & Context
		await requireRole(["client", "admin", "worker"]);
		const user = await getAuthenticatedUser();

		if (!user?.clientProfile?.id) {
			return errorResponse("Profil client introuvable", 404);
		}

		await prisma.clientProfile.update({
			where: { id: user.clientProfile.id },
			data: {
				freeServiceCount: { increment: 1 },
			},
		});

		return successResponse({
			message: "Congratulations! You received a gift worth 15000.",
		});
	} catch (error) {
		return handleApiError(error);
	}
}
