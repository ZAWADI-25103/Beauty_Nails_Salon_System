import { type NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const id = params.id;

		const media = await prisma.media.findUnique({
			where: {
				id,
			},
		});

		return successResponse(media);
	} catch (error) {}
}
