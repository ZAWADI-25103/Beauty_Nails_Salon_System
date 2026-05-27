import { endOfDay, format, startOfDay } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import {
	errorResponse,
	handleApiError,
	requireRole,
	successResponse,
} from "@/lib/api/helpers";
import {
	type ContentSection,
	generateReportPdf,
} from "@/lib/pdf/jsPdfGenerator";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		await requireRole(["admin"]);

		const { searchParams } = new URL(request.url);
		const fromParam = searchParams.get("from");
		const toParam = searchParams.get("to");
		const pdfTrigger = searchParams.get("pdfTrigger") === "true";

		if (!fromParam || !toParam) {
			return errorResponse("Dates requises", 400);
		}

		const from = startOfDay(new Date(fromParam));
		const to = endOfDay(new Date(toParam));

		if (isNaN(from.getTime()) || isNaN(to.getTime())) {
			return errorResponse("Dates invalides", 400);
		}

		// Fetch commissions in range
		const commissions = await prisma.commission.findMany({
			where: {
				createdAt: {
					gte: from,
					lte: to,
				},
			},
			include: {
				worker: {
					select: {
						id: true,
						user: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				},
			},
		});

		// Aggregates
		const totalCommissionAmount = commissions.reduce(
			(sum, c) => sum + Number(c.commissionAmount || 0),
			0,
		);
		const totalBusiness = commissions.reduce(
			(sum, c) => sum + Number(c.businessEarnings || 0),
			0,
		);
		const totalMaterials = commissions.reduce(
			(sum, c) => sum + Number(c.materialsCost || 0),
			0,
		);
		const totalOperational = commissions.reduce(
			(sum, c) => sum + Number(c.operationalCost || 0),
			0,
		);

		// Per-worker breakdown
		const byWorker: Record<
			string,
			{
				totalCommission: number;
				appointmentsCount: number;
				totalRevenue: number;
			}
		> = {};

		commissions.forEach((c: any) => {
			const workerName = c.worker?.user?.name || c.workerId;
			if (!byWorker[workerName]) {
				byWorker[workerName] = {
					totalCommission: 0,
					appointmentsCount: 0,
					totalRevenue: 0,
				};
			}
			byWorker[workerName].totalCommission += Number(c.commissionAmount || 0);
			byWorker[workerName].appointmentsCount += Number(c.appointmentsCount || 0);
			byWorker[workerName].totalRevenue += Number(c.totalRevenue || 0);
		});

		const workerRows = Object.entries(byWorker).map(([worker, vals]) => [
			worker,
			`CDF ${vals.totalCommission.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			vals.appointmentsCount.toString(),
			`CDF ${vals.totalRevenue.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		]);

		if (pdfTrigger) {
			const sections: ContentSection[] = [
				{
					title: "Commissions Summary",
					type: "keyValue",
					data: {
						"Period:": `${format(from, "MMM dd, yyyy")} - ${format(to, "MMM dd, yyyy")}`,
						"Total Amount:": `CDF ${(totalCommissionAmount + totalBusiness + totalMaterials + totalOperational).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
						"Worker's Commission:": `CDF ${totalCommissionAmount.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
						"Business Earnings:": `CDF ${totalBusiness.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
						"Materials Cost:": `CDF ${totalMaterials.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
						"Operational Cost:": `CDF ${totalOperational.toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
						"Total Commissioned Workers:": Object.keys(byWorker).length.toString(),
					},
				},
				{
					title: "Commissions by Worker",
					type: "table",
					data: {
						headers: ["Worker", "Commission Amount", "Appointments Count", "Total Revenue"],
						rows: workerRows,
					},
				},
				{
					title: "Detailed Commissions",
					type: "table",
					data: {
						headers: [
							"Worker",
							// "Period",
							"Total",
							"Rate",
							"W Earnings",
							"B Earnings",
							"Materials",
							"Operational Cost",
							"Appts",
							"Status",
						],
						rows: commissions.map((c: any) => [
							c.worker?.fullName || c.worker?.user?.name || c.workerId,
							// c.period,
							`${Number((c.commissionAmount + c.businessEarnings + c.materialsCost + c.operationalCost) || 0).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
							`${Number(c.commissionRate || 0).toFixed(2)}%`,
							`${Number(c.commissionAmount || 0).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
							`${Number(c.businessEarnings || 0).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
							`${Number(c.materialsCost || 0).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
							`${Number(c.operationalCost || 0).toLocaleString("fr-CD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
							c.appointmentsCount.toString(),
							c.status,
						]),
					},
				},
			];

			const pdfBuffer = await generateReportPdf(
				sections,
				"Beauty Nails - Commissions Report",
				`${format(from, "MMM dd")} to ${format(to, "MMM dd")}`,
			);

			return new NextResponse(pdfBuffer.toString("binary"), {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="commissions-report-${format(
						new Date(),
						"yyyy-MM-dd",
					)}.pdf"`,
				},
			});
		}

		return successResponse({
			totalCommissionAmount,
			totalBusiness,
			totalMaterials,
			totalOperational,
			workers: byWorker,
			commissionsCount: commissions.length,
			period: { from: fromParam, to: toParam },
		});
	} catch (error) {
		return handleApiError(error);
	}
}
