"use server";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;

		if (!id) return errorResponse("Invalid request");

		const referrals = await prisma.referral.findMany({
			where: {
				referrerId: id,
			},
			include: {
				referred: {
					select: {
						id: true,
						tier: true,
						loyaltyPoints: true,
						totalAppointments: true,
						totalSpent: true,
						referrals: true,
						user: {
							select: {
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				},
				referrer: {
					select: {
						id: true,
						tier: true,
						loyaltyPoints: true,
						totalAppointments: true,
						totalSpent: true,
						referrals: true,
						user: {
							select: {
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		return successResponse(referrals);
	} catch (error) {
		console.log(error);
		return handleApiError(error);
	}
}
