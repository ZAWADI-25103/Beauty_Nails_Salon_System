import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const from = searchParams.get("from");
		const to = searchParams.get("to");
		const clientId = searchParams.get("clientId");

		const where: any = {};

		if (from || to) {
			where.createdAt = {};
			if (from) where.createdAt.gte = new Date(from);
			if (to) where.createdAt.lte = new Date(to);
		}

		if (clientId) {
			where.clientId = clientId;
		}

		const sales = await prisma.sale.findMany({
			where,
			include: {
				client: {
					include: {
						user: true,
					},
				},
				items: {
					include: {
						service: true,
					},
				},
				payments: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json(sales);
	} catch (error: any) {
		return NextResponse.json(
			{ error: { message: error.message || "Failed to fetch sales" } },
			{ status: 500 },
		);
	}
}
