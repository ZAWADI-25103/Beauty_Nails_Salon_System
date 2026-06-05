"use server";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
	try {
		requireRole(["admin", "worker", "client"]);

		const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
			orderBy: { createdAt: "desc" },
		});

		if (!loyaltyTransactions) return errorResponse("no transactions ");

		// console.log(loyaltyTransactions)

		return successResponse({ transactions: loyaltyTransactions });
	} catch (error) {
		return handleApiError(error);
	}
}
