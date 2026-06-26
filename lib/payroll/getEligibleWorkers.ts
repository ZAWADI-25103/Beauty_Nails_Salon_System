import prisma from "@/lib/prisma";

export async function getEligibleWorkers(type: "daily" | "weekly" | "monthly") {
	const workers = await prisma.workerProfile.findMany({
		include: { user: true },
	});

	const now = new Date();
	const day = now.getDay() === 0 ? 7 : now.getDay();
	const date = now.getDate();

	return workers.filter((w) => {
		if (!w.commissionFrequency) return false;

		if (w.commissionFrequency !== type) return false;

		if (type === "daily") return true;

		if (type === "weekly") {
			return w.commissionDay === day;
		}

		if (type === "monthly") {
			return w.commissionDay === date;
		}

		return false;
	});
}