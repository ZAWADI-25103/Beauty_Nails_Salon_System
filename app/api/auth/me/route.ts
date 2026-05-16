import type { NextRequest } from "next/server";
import {
	errorResponse,
	getAuthenticatedUser,
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
	try {
		const sessionUser = await getAuthenticatedUser();

		const user = await prisma.user.findUnique({
			where: { id: sessionUser.id },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				avatar: true,
				role: true,
				isActive: true,
				clientProfile: true,
				workerProfile: true,
				createdAt: true,
			},
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		if (!user) {
			return errorResponse("User not found", 404);
		}

		return successResponse(user);
	} catch (error) {
		return handleApiError(error);
	}
}
