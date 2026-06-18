"use client";

import { useEffect, useRef, useState } from "react";
import { CommissionIssueDialog } from "./CommissionIssueDialog";
import { toast } from "sonner";

export const getNextResetDate = (frequency: Frequency, commissionDay: number) => {
	const now = new Date();
	const next = new Date(now);

	if (frequency === "daily") {
		next.setDate(now.getDate() + 1);
		next.setHours(0, 0, 0, 0);
		return next;
	}

	if (frequency === "weekly") {
		const targetDay = commissionDay > 0 && commissionDay < 8 ? commissionDay : 1;
		const jsDay = now.getDay() === 0 ? 7 : now.getDay();
		const diff = (targetDay - jsDay + 7) % 7;
		next.setDate(now.getDate() + (diff === 0 ? 7 : diff));
		next.setHours(0, 0, 0, 0);
		return next;
	}

	if (frequency === "monthly") {
		// Clamp commission day to valid month range
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();
		const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		const safeCommissionDay = Math.min(commissionDay, daysInCurrentMonth);

		next.setMonth(currentMonth, safeCommissionDay);
		next.setHours(0, 0, 0, 0);

		if (next <= now) {
			// Move to next month
			const nextMonth = currentMonth + 1;
			const nextYear = currentYear + (nextMonth > 11 ? 1 : 0);
			const actualNextMonth = nextMonth % 12;
			const daysInNextMonth = new Date(nextYear, actualNextMonth + 1, 0).getDate();
			const safeNextCommissionDay = Math.min(commissionDay, daysInNextMonth);

			next.setFullYear(nextYear);
			next.setMonth(actualNextMonth, safeNextCommissionDay);
			next.setHours(0, 0, 0, 0);
		}
		return next;
	}

	return next;
};

const getNextPayoutDate = (
	frequency: Frequency,
	commissionDay: number,
	lastPaidAt?: Date | string | null,
) => {
	const now = new Date();

	const next = new Date(now);
	next.setHours(18, 0, 0, 0); // 6 PM FIXED

	// DAILY → same day 6 PM
	if (frequency === "daily") {
		if (now.getHours() >= 18) {
			// already past today's 6 PM → tomorrow 6 PM
			next.setDate(next.getDate() + 1);
		}
		return next;
	}

	// WEEKLY → chosen weekday at 6 PM
	if (frequency === "weekly") {
		const targetDay = commissionDay || 1; // 1–7
		const jsDay = now.getDay() === 0 ? 7 : now.getDay();

		let diff = targetDay - jsDay;

		if (diff < 0 || (diff === 0 && now.getHours() >= 18)) {
			diff += 7;
		}

		next.setDate(next.getDate() + diff);
		return next;
	}

	// MONTHLY → chosen day at 6 PM
	if (frequency === "monthly") {
		const day = commissionDay || 1;

		next.setDate(day);
		next.setHours(18, 0, 0, 0);

		if (now > next) {
			next.setMonth(next.getMonth() + 1);
		}

		return next;
	}

	return next;
};

export type Frequency = "daily" | "weekly" | "monthly";

export function PayrollCountdown({
	frequency = "monthly",
	commissionDay = 1,
	lastCommissionPaidAt,
	workerName,
	userId,
	onReadyChange,
}: {
	frequency?: Frequency;
	commissionDay?: number;
	lastCommissionPaidAt?: Date | string | null;
	workerName?: string;
	userId?: string;
	onReadyChange?: (ready: boolean) => void;
}) {
	const [timeLeft, setTimeLeft] = useState("");
	const [isReady, setIsReady] = useState(false);
	const [unpaidPeriods, setUnpaidPeriods] = useState(0);

	const lastState = useRef<boolean | null>(null);

	// Calculate unpaid periods based on last payment date
	const calculateUnpaidPeriods = (lastPaid: Date, now: Date): number => {
		if (frequency === "daily") {
			const daysDiff = Math.floor((now.getTime() - lastPaid.getTime()) / (1000 * 60 * 60 * 24));
			return Math.max(0, daysDiff - 1); // -1 because current period isn't due yet
		}

		if (frequency === "weekly") {
			const weeksDiff = Math.floor((now.getTime() - lastPaid.getTime()) / (1000 * 60 * 60 * 24 * 7));
			return Math.max(0, weeksDiff - 1);
		}

		if (frequency === "monthly") {
			let monthsDiff = (now.getFullYear() - lastPaid.getFullYear()) * 12;
			monthsDiff += now.getMonth() - lastPaid.getMonth();
			return Math.max(0, monthsDiff - 1);
		}

		return 0;
	};

	// Check for unpaid periods when lastCommissionPaidAt is provided
	useEffect(() => {
		if (lastCommissionPaidAt) {
			const now = new Date();
			const lastPaid = new Date(lastCommissionPaidAt);
			const periods = calculateUnpaidPeriods(lastPaid, now);
			setUnpaidPeriods(periods);
		}
	}, [lastCommissionPaidAt, frequency]);

	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date();

			const nextPayoutDate = getNextPayoutDate(
				frequency,
				commissionDay,
				lastCommissionPaidAt,
			);

			const ready = now >= nextPayoutDate;

			setIsReady(ready);

			if (lastState.current !== ready) {
				lastState.current = ready;
				onReadyChange?.(ready);
			}

			if (ready) {
				setTimeLeft("Available Now (6:00 PM)");
				return;
			}

			const diff = nextPayoutDate.getTime() - now.getTime();

			const seconds = Math.floor(diff / 1000) % 60;
			const minutes = Math.floor(diff / (1000 * 60)) % 60;
			const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));

			setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
		}, 1000);

		return () => clearInterval(interval);
	}, [frequency, commissionDay, lastCommissionPaidAt, onReadyChange]);

	// Format last paid date nicely
	const formatLastPaid = (date: Date | string | null | undefined) => {
		if (!date) return null;
		const d = new Date(date);
		return d.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const nextEligibleDate = getNextPayoutDate(
		frequency,
		commissionDay,
		lastCommissionPaidAt,
	);

	return (
		<>
			<div className="space-y-3">
				{/* Last payment info with unpaid warning */}
				{lastCommissionPaidAt && (
					<div className={`rounded-lg p-3 text-sm transition-all ${unpaidPeriods > 0
						? "bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-900"
						: "bg-gray-50 border border-gray-200 dark:bg-gray-950 dark:border-gray-800"
						}`}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-wide opacity-60">
									Last Payment
								</p>
								<p className="font-medium">
									{formatLastPaid(lastCommissionPaidAt)}
								</p>
							</div>

							{unpaidPeriods > 0 && (
								<div className="text-right">
									<p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
										⚠️ {unpaidPeriods} Unpaid {frequency === 'daily' ? 'Day' : frequency === 'weekly' ? 'Week' : 'Month'}
										{unpaidPeriods > 1 ? 's' : ''}
									</p>
									{unpaidPeriods > 0 && (
										<CommissionIssueDialog
											frequency={frequency}
											unpaidPeriods={unpaidPeriods}
											expectedDate={getNextResetDate(frequency, commissionDay)}
											lastPaidDate={lastCommissionPaidAt ? new Date(lastCommissionPaidAt) : null}
											workerName={workerName}
											userId={userId}
											onSent={() => {
												toast.info("Our HR team will review your case shortly.");
											}}
										/>
									)}
								</div>
							)}
						</div>

						{unpaidPeriods > 0 && (
							<p className="text-xs mt-2 opacity-70">
								Your {frequency} commission hasn't been paid for {unpaidPeriods} period{unpaidPeriods > 1 ? 's' : ''}.
								Please reach out to HR if this continues.
							</p>
						)}
					</div>
				)}

				{/* Original countdown card */}
				<div
					className={`relative rounded-xl p-4 border text-center transition-all
          ${isReady
							? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-900"
						: unpaidPeriods > 0
							? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950 dark:border-amber-900"
								: "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950 dark:border-pink-900"
						}`}
				>
					{!isReady && unpaidPeriods === 0 && (
						<div className="absolute inset-0 rounded-xl animate-pulse opacity-20 bg-current" />
					)}

					<p className="text-xs text-white uppercase tracking-wide opacity-80">
						{isReady
							? "Payment Available"
							: unpaidPeriods > 0
								? "Payment Overdue"
								: "Next Payment in"}
					</p>

					<p className="text-2xl text-white font-semibold tracking-tight">
						{unpaidPeriods > 0 && !isReady ? "Overdue" : timeLeft}
					</p>

					<div className="mt-2 text-xs text-white opacity-70">
						{nextEligibleDate.toLocaleDateString(undefined, {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}{" "} at 6 PM
					</div>
				</div>
			</div>
		</>
	);
}