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
		const profile = await prisma.salonProfile.findFirst();

		if (!profile) {
			return errorResponse("Profile not found", 404);
		}

		return successResponse(profile);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		await requireRole(["admin"]);

		const body = await request.json();
		const profile = await prisma.salonProfile.updateMany({
			data: body,
		});

		return successResponse({
			message: "Profile updated",
			profile,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
