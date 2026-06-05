"use server";
import type { NextRequest } from "next/server";
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
		await requireRole(["admin", "worker"]);

		const schedule = await prisma.workerSchedule.findMany({
			where: { workerId: id },
			orderBy: { dayOfWeek: "asc" },
		});

		const worker = await prisma.workerProfile.findUnique({
			where: { id: id },
			select: {
				workingHours: true,
			},
		});

		return successResponse({
			schedule,
			workingHours: worker?.workingHours,
		});
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		await requireRole(["admin", "worker"]);

		const body = await request.json();
		const { dayOfWeek, startTime, endTime, isAvailable } = body;

		const schedule = await prisma.workerSchedule.upsert({
			where: {
				workerId_dayOfWeek: {
					workerId: id,
					dayOfWeek,
				},
			},
			update: {
				startTime,
				endTime,
				isAvailable,
			},
			create: {
				workerId: id,
				dayOfWeek,
				startTime,
				endTime,
				isAvailable,
			},
		});

		return successResponse({
			message: "Schedule updated",
			schedule,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
