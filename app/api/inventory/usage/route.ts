import type { NextRequest } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import prisma from "@/lib/prisma";

function getDateRangeForPeriod(period: string): {
	start: Date;
	end: Date;
	previousStart: Date;
	previousEnd: Date;
} {
	const now = new Date();
	let start: Date;
	let end: Date = now;

	switch (period) {
		case "week": {
			const dayOfWeek = now.getDay();
			start = new Date(now);
			start.setDate(now.getDate() - dayOfWeek);
			start.setHours(0, 0, 0, 0);
			break;
		}
		case "year": {
			start = new Date(now.getFullYear(), 0, 1);
			break;
		}
		case "month":
		default: {
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
		}
	}

	// Previous period: same duration before current period
	const periodDuration = end.getTime() - start.getTime();
	const previousEnd = new Date(start.getTime() - 1);
	const previousStart = new Date(previousEnd.getTime() - periodDuration);

	return { start, end, previousStart, previousEnd };
}

// GET: Fetch usage records or aggregated usage report
export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin", "worker"]);
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get("itemId");
		const appointmentId = searchParams.get("appointmentId");
		const period = searchParams.get("period");

		// If a period is provided, return an aggregated usage report
		if (period) {
			const { start, end, previousStart, previousEnd } =
				getDateRangeForPeriod(period);

			// Current period usages
			const currentUsages = await prisma.inventoryUsage.findMany({
				where: {
					createdAt: { gte: start, lte: end },
					...(itemId ? { itemId } : {}),
				},
				include: { item: true },
			});

			// Previous period usages (for trend comparison)
			const previousUsages = await prisma.inventoryUsage.findMany({
				where: {
					createdAt: { gte: previousStart, lte: previousEnd },
					...(itemId ? { itemId } : {}),
				},
				include: { item: true },
			});

			// Aggregate current period by item
			const itemUsageMap = new Map<
				string,
				{ name: string; unit: string; used: number; totalCost: number }
			>();
			for (const u of currentUsages) {
				const existing = itemUsageMap.get(u.itemId);
				if (existing) {
					existing.used += u.quantity;
					existing.totalCost += u.quantity * u.item.cost;
				} else {
					itemUsageMap.set(u.itemId, {
						name: u.item.name,
						unit: u.item.unit,
						used: u.quantity,
						totalCost: u.quantity * u.item.cost,
					});
				}
			}

			// Aggregate previous period by item for trend
			const prevItemUsageMap = new Map<string, number>();
			for (const u of previousUsages) {
				const existing = prevItemUsageMap.get(u.itemId) ?? 0;
				prevItemUsageMap.set(u.itemId, existing + u.quantity);
			}

			// Build report items with trend
			let totalCost = 0;
			const items: Array<{
				itemId: string;
				name: string;
				unit: string;
				used: number;
				totalCost: number;
				trend: "up" | "down" | "stable";
				trendPercentage: number;
			}> = [];

			for (const [id, data] of itemUsageMap) {
				totalCost += data.totalCost;
				const prevUsed = prevItemUsageMap.get(id) ?? 0;
				let trend: "up" | "down" | "stable" = "stable";
				let trendPercentage = 0;
				if (prevUsed > 0) {
					trendPercentage = Math.round(
						((data.used - prevUsed) / prevUsed) * 100,
					);
					trend =
						trendPercentage > 5
							? "up"
							: trendPercentage < -5
								? "down"
								: "stable";
				} else if (data.used > 0) {
					trend = "up";
					trendPercentage = 100;
				}

				items.push({
					itemId: id,
					name: data.name,
					unit: data.unit,
					used: data.used,
					totalCost: data.totalCost,
					trend,
					trendPercentage,
				});
			}

			// Sort by most used
			items.sort((a, b) => b.used - a.used);

			// Previous period totals for global stats
			const prevTotalUsed = previousUsages.reduce(
				(sum, u) => sum + u.quantity,
				0,
			);
			const currentTotalUsed = currentUsages.reduce(
				(sum, u) => sum + u.quantity,
				0,
			);
			const usageChange =
				prevTotalUsed > 0
					? Math.round(
							((currentTotalUsed - prevTotalUsed) / prevTotalUsed) *
								100,
						)
					: currentTotalUsed > 0
						? 100
						: 0;

			return successResponse({
				items,
				totalCost: Math.round(totalCost),
				totalItemsUsed: currentTotalUsed,
				previousTotalUsed: prevTotalUsed,
				usageChange,
				uniqueAppointments: new Set(
					currentUsages.map((u) => u.usedFor).filter(Boolean),
				).size,
			});
		}

		// Legacy behavior: return raw usage records
		const where: any = {};
		if (itemId) where.itemId = itemId;
		if (appointmentId) where.usedFor = appointmentId;

		const usages = await prisma.inventoryUsage.findMany({
			where,
			include: {
				item: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return successResponse(usages);
	} catch (error) {
		return handleApiError(error);
	}
}

// POST: Record inventory usage for an appointment
export async function POST(request: NextRequest) {
	try {
		const user = await requireRole(["worker", "admin"]);
		const body = await request.json();

		const {
			appointmentId,
			items, // Array of { itemId, quantity, notes? }
			workerId,
		} = body;

		if (!appointmentId || !items || items.length === 0) {
			return errorResponse("Missing data", 400);
		}

		// Verify appointment exists and is in_progress
		const appointment = await prisma.appointment.findUnique({
			where: { id: appointmentId },
			include: { service: true },
		});

		if (!appointment) {
			return errorResponse("Appointment not found", 404);
		}

		if (appointment.status !== "in_progress") {
			return errorResponse(
				"Appointment must be in progress to record usage",
				400,
			);
		}

		// Process each inventory item usage
		const results = [];

		for (const usage of items) {
			const item = await prisma.inventoryItem.findUnique({
				where: { id: usage.itemId },
			});

			if (!item) {
				return errorResponse(`Item ${usage.itemId} not found`, 404);
			}

			// Calculate actual deduction based on unit and shared resource logic
			let deduction = usage.quantity;

			// Shared resource logic: if unit is "piece" and item is marked as shared, only deduct once per appointment
			const isSharedResource =
				item.unit === "piece" && item.name.toLowerCase().includes("bottle");
			if (isSharedResource) {
				// Check if this item was already used for this appointment
				const existingUsage = await prisma.inventoryUsage.findFirst({
					where: {
						itemId: usage.itemId,
						usedFor: appointmentId,
					},
				});

				if (existingUsage) {
					// Already recorded, skip deduction
					continue;
				}
				// First time use: deduct 1 regardless of quantity requested
				deduction = 1;
			}

			// For liquid units (ml), calculate proportional deduction
			if (item.unit === "ml" && usage.quantity) {
				// e.g., if bottle has 100ml and worker uses 5ml, deduct 5
				deduction = usage.quantity;
			}

			// Create usage record
			const usageRecord = await prisma.inventoryUsage.create({
				data: {
					itemId: usage.itemId,
					quantity: deduction,
					usedBy: workerId || user.workerProfile?.id,
					usedFor: appointmentId,
					notes: usage.notes,
				},
			});

			// Update inventory stock
			const updatedItem = await prisma.inventoryItem.update({
				where: { id: usage.itemId },
				data: {
					currentStock: { decrement: deduction },
					// Update status based on new stock level
					status: {
						set: await calculateStockStatus(
							item.currentStock - deduction,
							item.minStock,
							item?.maxStock!,
						),
					},
				},
			});

			// Create transaction record for audit
			await prisma.inventoryTransaction.create({
				data: {
					itemId: usage.itemId,
					quantity: -deduction, // Negative for usage
					type: "usage",
					notes: `Used for appointment #${appointmentId} - ${usage.notes || ""}`,
					performedBy: workerId || user.id,
				},
			});

			results.push({ usage: usageRecord, item: updatedItem });
		}

		return successResponse({
			results,
			message: "Item usage recorded successfully",
		});
	} catch (error) {
		return handleApiError(error);
	}
}

// Helper function to calculate stock status
async function calculateStockStatus(
	currentStock: number,
	minStock: number,
	maxStock?: number,
) {
	if (currentStock === 0) return "out_of_stock";
	if (currentStock <= minStock) return "critical";
	if (maxStock && currentStock <= minStock * 1.5) return "low";
	return "good";
}
