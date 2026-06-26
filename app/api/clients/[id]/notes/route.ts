
import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;

		await requireRole(["admin", "worker"]);

		const body = await request.json();
		const { notes } = body;

		const client = await prisma.clientProfile.update({
			where: { userId: id },
			data: { notes },
		});

		return successResponse({
			message: "Notes updated",
			client,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
