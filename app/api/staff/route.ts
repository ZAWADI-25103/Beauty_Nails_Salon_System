"use server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin", "worker"]);

		const { searchParams } = new URL(request.url);
		const isAvailable = searchParams.get("isAvailable");

		const where: any = {};
		if (isAvailable !== null) {
			where.isAvailable = isAvailable === "true";
		}

		const staff = await prisma.workerProfile.findMany({
			where,
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
			orderBy: { createdAt: "desc" },
		});

		const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

		const staffIds = staff.map((s: any) => s.id);

		// Get the earliest possible start date (e.g., start of this month)
		// to cover all staff frequencies in one go.
		const now = new Date();
		const globalStartDate = new Date(now.getFullYear(), now.getMonth(), 1);

		// 2. FETCH ALL COMMISSIONS AT ONCE
		const allCommissions = await prisma.commission.findMany({
			where: {
				workerId: { in: staffIds },
				createdAt: { gte: globalStartDate },
			},
		});

		// 3. FETCH ALL ACTIVE APPOINTMENTS AT ONCE
		const allBusyAppointments = await prisma.appointment.findMany({
			where: {
				workerId: { in: staffIds },
				status: "in_progress",
			},
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
		});

		const formattedStaff = staff.map((s: any) => {
			const completedApps = s.appointments || [];
			// const totalRevenue = completedApps.reduce((sum: any, app: any) => sum + (app.price || 0), 0);

			const uniqueClients = new Set(completedApps.map((a: any) => a.clientId))
				.size;
			const retention =
				completedApps.length > 0
					? Math.round((uniqueClients / completedApps.length) * 100)
					: 0;
			const daysToWorks = s.schedules
				.filter((sch: any) => sch.isAvailable)
				.map((sch: any) => daysMap[sch.dayOfWeek]);

			// Calculate date range based on period
			// Filter commissions for THIS specific staff member in memory
			const staffCommissions = allCommissions.filter(
				(c) => c.workerId === s.id,
			);

			// Find if this staff member is busy from our pre-fetched list
			const isBusy = allBusyAppointments.find((app) => app.workerId === s.id);

			const totalEarnings = staffCommissions.reduce(
				(sum, c) => sum + c.commissionAmount,
				0,
			);
			const totalBusiness = staffCommissions.reduce((sum, c) => {
				const buzRate = 100 - c.commissionRate;
				const buzEarnings = (c.totalRevenue * buzRate) / 100;

				return sum + buzEarnings;
			}, 0);
			const totalRevenue = staffCommissions.reduce(
				(sum, c) => sum + c.totalRevenue,
				0,
			);
			const matCost = totalBusiness * 0.5;
			const operaCost = totalBusiness * 0.5;

			return {
				id: s.id,
				userId: s.userId,
				position: s.position,
				specialties: s.specialties,
				commissionRate: s.commissionRate,
				rating: s.rating,
				totalReviews: s.totalReviews,
				isAvailable: isBusy ? true : false,
				currentlyWorking: isBusy,
				workingHours: s.workingHours,
				hireDate: s.hireDate.toISOString(),
				createdAt: s.createdAt.toISOString(),
				updatedAt: s.updatedAt.toISOString(),
				totalSales: completedApps.length,
				totalEarnings: totalEarnings,
				businessRevenue: totalBusiness,
				materialsReserve: matCost,
				operationalCosts: operaCost,
				user: s.user,
				schedules: s?.schedules.filter((sch: any) => sch.isAvailable),
				appointments: s.appointments,
				name: s.user.name,
				role: s.position,
				phone: s.user.phone,
				email: s.user.email,
				workingDays: daysToWorks,
				workingHoursString:
					typeof s.workingHours === "string" ? s.workingHours : "Not defined",
				appointmentsCount: completedApps.length,
				revenue: totalRevenue.toString(),
				clientRetention: `${retention}%`,
				upsellRate: `${Math.round(completedApps.filter((app: any) => app.price > 0).length / completedApps.length)}%`,
				commission: s.commissionRate,
				status: s.isAvailable ? "active" : "off",
			};
		});

		return successResponse(formattedStaff);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireRole(["admin"]);

		const body = await request.json();
		const {
			name,
			email,
			phone,
			password,
			role = "worker",
			workerProfile: { position, specialties, commissionRate, workingHours },
		} = body;

		// Validation
		if (!name || !email || !phone || !password) {
			return errorResponse("All fields are required", 400);
		}

		// Check if user exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { phone }],
			},
		});

		if (existingUser) {
			return successResponse("Email or phone already in use", 202);
		}

		// Hash password
		const hashedPassword = await hash(password, 10);

		const dataClause: any = {
			name,
			email,
			phone,
			password: hashedPassword,
			role,
			isActive: true,
			emailVerified: new Date(),
			clientProfile: {
				create: {
					referralCode: nanoid(8).toUpperCase(),
					tier: "Regular",
					// isAvailable: true,
				},
			},
			workerProfile: {
				create: {
					position,
					specialties,
					commissionRate,
					workingHours,
					hireDate: new Date(),
					isAvailable: true,
				},
			},
		};

		// Create user with profile
		const user = await prisma.user.create({
			data: dataClause,
			include: {
				clientProfile: true,
				workerProfile: true,
			},
		});

		// Remove password from response
		const { password: _, ...userWithoutPassword } = user;

		return successResponse(
			{
				user: userWithoutPassword,
				message: "Account created successfully",
			},
			201,
		);
	} catch (error) {
		return handleApiError(error);
	}
}
