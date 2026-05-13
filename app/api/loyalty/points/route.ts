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
		});

		if (!client) {
			return errorResponse("Client non trouvé", 404);
		}

		const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
			where: { clientId: client.id },
			orderBy: { createdAt: "desc" },
			take: 20,
		});

		const loyaltyPoints = await prisma.loyaltyTransaction.aggregate({
			where: { clientId: client.id },
			_sum: {
				points: true,
			},
		});

		return successResponse({
			points: loyaltyPoints._sum.points || 0,
			tier: client.tier,
			transactions: loyaltyTransactions,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
