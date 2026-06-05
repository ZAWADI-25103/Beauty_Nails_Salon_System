"use server";
import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin", "worker", "client"]);

		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const status = searchParams.get("status");

		const where: any = {};

		if (category) {
			where.category = category;
		}

		if (status) {
			where.status = status;
		}

		const items = await prisma.inventoryItem.findMany({
			where,
			include: {
				_count: {
					select: {
						transactions: true,
						reorders: true,
					},
				},
			},
			orderBy: { currentStock: "asc" },
		});

		return successResponse(items);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireRole(["admin", "worker"]);
		const body = await request.json();
		const {
			name,
			category,
			description,
			sku,
			minStock,
			currentStock,
			unit,
			cost,
			supplier,
			status = "good",
			maxStock,
		} = body;

		const newItem = await prisma.inventoryItem.create({
			data: {
				name,
				category,
				description,
				currentStock,
				minStock,
				maxStock,
				cost,
				sku,
				unit,
				supplier,
				status,
			},
		});
		return successResponse(newItem, 201);
	} catch (error) {
		return handleApiError(error);
	}
}
