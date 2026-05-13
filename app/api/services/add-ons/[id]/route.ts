import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		await requireRole(["admin"]);

		if (!id) {
			return errorResponse("id is required", 400);
		}

		const serviceAddOn = await prisma.serviceAddOn.delete({
			where: { id },
		});

		await prisma.service.update({
			where: { id: serviceAddOn.serviceId },
			data: {
				price: {
					decrement: serviceAddOn.price,
				},
				duration: {
					decrement: serviceAddOn.duration,
				},
			},
		});

		return successResponse({ success: true });
	} catch (error) {
		return handleApiError(error);
	}
}
