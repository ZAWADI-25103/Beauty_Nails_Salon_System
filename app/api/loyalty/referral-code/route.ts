"use server";
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
		const user = await getAuthenticatedUser();

		const client = await prisma.clientProfile.findUnique({
			where: { userId: user.id },
			select: {
				id: true,
				referralCode: true,
				referrals: true,
			},
		});

		if (!client) {
			return errorResponse("Client non trouvé", 404);
		}

		console.log("Returned data:", {
			code: client.referralCode,
			referrals: client.referrals || 0,
		});

		return successResponse({
			code: client.referralCode,
			referrals: client.referrals || 0,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
