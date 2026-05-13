"use server";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const id = (await context.params).id;
		await requireRole(["admin", "worker"]);

		const { searchParams } = new URL(request.url);
		const isAvailable = searchParams.get("isAvailable");

		const where: any = {};
		if (isAvailable !== null) {
			where.isAvailable = isAvailable === "true";
		}

		const staff: any = await prisma.workerProfile.findUnique({
			where: {
				id,
				...where,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						avatar: true,
						isActive: true,
					},
				},
				schedules: true,
				appointments: {
					where: {
						status: "completed",
					},
					select: {
						price: true,
						clientId: true,
					},
				},
			},
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

		if (!staff) {
			throw new Error("Staff not found");
		}

		const completedApps = staff?.appointments || [];
		// const totalRevenue = completedApps.reduce((sum: any, app: any) => sum + (app.price || 0), 0);

		const uniqueClients = new Set(completedApps.map((a: any) => a.clientId))
			.size;
		const retention =
			completedApps.length > 0
				? Math.round((uniqueClients / completedApps.length) * 100)
				: 0;

		const daysToWorks = staff.schedules
			.filter((sch: any) => sch.isAvailable)
			.map((sch: any) => daysMap[sch.dayOfWeek]);

		// Calculate date range based on period
		const now = new Date();
		const startDate = new Date();

		if (staff.commissionFrequency === "weekly") {
			startDate.setDate(now.getDate() - now.getDay()); // Start of current week
		} else if (staff.commissionFrequency === "monthly") {
			startDate.setDate(1); // Start of current month
		} else if (staff.commissionFrequency === "daily") {
			startDate.setDate(now.getDate()); // Start of today
		}

		const commissions = await prisma.commission.findMany({
			where: {
				workerId: id,
				createdAt: {
					gte: startDate,
					// lte: now,
				},
			},
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		const totalEarnings = commissions.reduce(
			(sum, c) => sum + c.commissionAmount,
			0,
		);
		const totalBusiness = commissions.reduce(
			(sum, c) => sum + c.businessEarnings,
			0,
		);
		const totalRevenue = commissions.reduce(
			(sum, c) => sum + c.totalRevenue,
			0,
		);
		const matCost = totalBusiness * 0.05; // 5% des revenus pour les matériaux
		const operaCost = totalBusiness * 0.05; // 5% des revenus pour les coûts opérationnels

		const isBusy = await prisma.appointment.findFirst({
			where: { status: "in_progress", workerId: staff.id },
			include: {
				client: {
					include: {
						user: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			cacheStrategy: {
				ttl: 60, // Fresh for 60 seconds
				swr: 30, // For another 30s, serve old data while updating in background
			},
		});

		// console.log("is busy working on: ", isBusy)

		const formattedStaff = {
			id: staff?.id,
			userId: staff?.userId,
			position: staff?.position,
			specialties: staff?.specialties,
			commissionRate: staff?.commissionRate,
			rating: staff?.rating,
			totalReviews: staff?.totalReviews,
			isAvailable: isBusy ? true : false,
			currentlyWorking: isBusy,
			workingHours: staff?.workingHours,
			hireDate: staff?.hireDate.toISOString(),
			createdAt: staff?.createdAt.toISOString(),
			updatedAt: staff?.updatedAt.toISOString(),
			totalSales: completedApps.length,
			totalEarnings: totalEarnings,
			businessRevenue: totalBusiness,
			materialsReserve: matCost,
			operationalCosts: operaCost,
			user: staff?.user,
			schedules: staff?.schedules.filter((sch: any) => sch.isAvailable),
			appointments: staff?.appointments,
			name: staff?.user.name,
			role: staff?.position,
			phone: staff?.user.phone,
			email: staff?.user.email,
			workingDays: daysToWorks,
			workingHoursString:
				typeof staff?.workingHours === "string"
					? staff?.workingHours
					: "Non défini",
			appointmentsCount: completedApps.length,
			revenue: totalRevenue.toString(),
			clientRetention: `${retention}%`,
			upsellRate: `${Math.round(completedApps.filter((app: any) => app.price > 0).length / completedApps.length)}%`,
			commission: staff?.commissionRate,
			status: staff?.isAvailable ? "active" : "off",
		};

		// console.log(formattedStaff)

		return successResponse(formattedStaff);
	} catch (error) {
		return handleApiError(error);
	}
}
