import type { NextRequest } from "next/server";
import {
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin"]);

		const settings = await prisma.systemSetting.findMany();

		// Convert settings array to an object for easier access
		const settingsObject: Record<string, any> = {};
		settings.forEach((setting) => {
			settingsObject[setting.key] = setting.value;
		});

		return successResponse(settingsObject);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireRole(["admin"]);

		const data = await request.json();

		// Update or create each setting
		const results = [];
		for (const [key, value] of Object.entries(data)) {
			const result = await prisma.systemSetting.upsert({
				where: { key },
				update: {
					value: value as string,
					updatedAt: new Date(),
				},
				create: {
					key,
					value: value as string,
					category: "general", // Default category
				},
			});
			results.push(result);
		}

		return successResponse(results);
	} catch (error) {
		return handleApiError(error);
	}
}
