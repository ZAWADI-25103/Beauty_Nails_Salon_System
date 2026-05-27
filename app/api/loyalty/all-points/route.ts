"use server";
import type { NextRequest } from "next/server";
import {
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
	try {
		

		const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
			orderBy: { createdAt: "desc" },
			take: 20,
		});

		const loyaltyPoints = await prisma.loyaltyTransaction.aggregate({
			_sum: {
				points: true,
			},
		});

		return successResponse({
			points: loyaltyPoints._sum.points || 0,
			transactions: loyaltyTransactions,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
