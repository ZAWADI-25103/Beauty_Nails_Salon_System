"use server";
import type { NextRequest } from "next/server";
import {
	getAuthenticatedUser,
	handleApiError,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function PUT(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		const user = await getAuthenticatedUser();

		await prisma.notification.update({
			where: {
				id,
				userId: user.id,
			},
			data: { isRead: true },
		});

		return successResponse({ message: "Notification marked as read" });
	} catch (error) {
		return handleApiError(error);
	}
}
