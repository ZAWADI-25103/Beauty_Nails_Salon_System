import prisma from "@/lib/prisma";

export async function processWorkerPayroll(workerId: string, period: string) {
	const worker = await prisma.workerProfile.findUnique({
		where: { id: workerId },
		include: { user: true },
	});

	if (!worker) return;

	const lastPaidAt = worker.lastCommissionPaidAt ?? worker.createdAt;

	const initializedCommissions = await prisma.commission.findMany({
		where: {
			workerId,
			commissionInitializedAtAppointmentCompletion: true,
			createdAt: {
				gt: lastPaidAt,
			},
		},
	});

	if (!initializedCommissions.length) return;

	const totalRevenue = initializedCommissions.reduce(
		(sum, c) => sum + c.totalRevenue,
		0,
	);

	const appointmentsCount = initializedCommissions.reduce(
		(sum, c) => sum + c.appointmentsCount,
		0,
	);

	const commissionAmount = initializedCommissions.reduce(
		(sum, c) => sum + c.commissionAmount,
		0,
	);

	const businessEarnings = initializedCommissions.reduce(
		(sum, c) => sum + c.businessEarnings,
		0,
	);

	const materialsCost = initializedCommissions.reduce(
		(sum, c) => sum + c.materialsCost,
		0,
	);

	const operationalCost = initializedCommissions.reduce(
		(sum, c) => sum + c.operationalCost,
		0,
	);

	const existing = await prisma.commission.findUnique({
		where: {
			workerId_period: {
				workerId,
				period,
			},
		},
	});

	if (existing) return;

	const commission = await prisma.$transaction(async (tx) => {
		const created = await tx.commission.create({
			data: {
				workerId,
				period,
				totalRevenue,
				appointmentsCount,
				commissionRate: worker.commissionRate ?? 0,
				commissionAmount,
				businessEarnings,
				materialsCost,
				operationalCost,
				commissionInitializedAtAppointmentCompletion: false,
				status: "pending",
			},
		});

		await tx.workerProfile.update({
			where: { id: workerId },
			data: {
				lastCommissionPaidAt: new Date(),
			},
		});

		await tx.commission.updateMany({
			where: {
				workerId,
				commissionInitializedAtAppointmentCompletion: true,
				createdAt: { gt: lastPaidAt },
			},
			data: {
				status: "approved",
			},
		});

		return created;
	});

	// notifications
	const admin = await prisma.user.findFirst({
		where: { role: "admin" },
	});

	if (admin) {
		await prisma.notification.create({
			data: {
				userId: admin.id,
				type: "system",
				title: "Payroll Generated",
				message: `Payroll generated for ${worker.user?.name}`,
				link: `/dashboard/admin`,
			},
		});
	}

	await prisma.notification.create({
		data: {
			userId: worker.userId,
			type: "system",
			title: "Payroll Ready",
			message: `Your commission for ${period} is ready`,
			link: `/dashboard/worker`,
		},
	});

	return commission;
}