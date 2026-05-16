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
			return errorResponse("Client profile not found", 404);
		}

		// 2. Validation
		const { refIds } = await req.json();

		if (!Array.isArray(refIds) || refIds.length === 0 || refIds.length > 5) {
			return errorResponse("Invalid number of referrals (max 5)");
		}

		// 3. Atomic Transaction
		// This ensures data consistency: if one update fails, they all roll back.
		await prisma.$transaction(async (tx) => {
			// Update all selected referrals to 'rewarded'
			await tx.referral.updateMany({
				where: {
					id: { in: refIds },
					referrerId: user.clientProfile!.id, // Security: ensure these belong to the user
					status: { not: "rewarded" }, // Prevent double-claiming
				},
				data: { status: "rewarded" },
			});

			// Increment the user's bonus percentage
			await tx.clientProfile.update({
				where: { id: user.clientProfile!.id },
				data: {
					refBonus: {
						increment: 10,
					},
				},
			});
		});

		return successResponse({
			message:
				"Congratulations! Your 10% referral bonus has been applied.",
		});
	} catch (error) {
		return handleApiError(error);
	}
}
