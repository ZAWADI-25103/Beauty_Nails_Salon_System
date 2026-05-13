import { type NextRequest, NextResponse } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		// await requireRole(['admin', 'worker', 'client']);

		const addOns = await prisma.serviceAddOn.findMany({
			where: { serviceId: id },
			orderBy: { createdAt: "asc" },
		});

		return successResponse(addOns);
	} catch (error) {
		return handleApiError(error);
	}
}
