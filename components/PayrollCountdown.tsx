"use client";

import { useEffect, useRef, useState } from "react";

type Frequency = "daily" | "weekly" | "monthly";

export function PayrollCountdown({
	frequency = "monthly",
	commissionDay = 1,
	onReadyChange,
}: {
	frequency?: Frequency;
		commissionDay?: number;
	onReadyChange?: (ready: boolean) => void;
}) {
	const [timeLeft, setTimeLeft] = useState("");
	const [isReady, setIsReady] = useState(false);

	// prevent unnecessary callback spam
	const lastState = useRef<boolean | null>(null);

	const getNextResetDate = () => {
		const now = new Date();
		const next = new Date(now);

		if (frequency === "daily") {
			next.setDate(now.getDate() + 1);
			next.setHours(0, 0, 0, 0);
			return next;
		}

		if (frequency === "weekly") {
			const jsDay = now.getDay() === 0 ? 7 : now.getDay();
			const targetDay = commissionDay > 0 && commissionDay < 8 ? commissionDay : 1;
			const diff = (targetDay - jsDay + 7) % 7;
			next.setDate(now.getDate() + (diff === 0 ? 7 : diff));
			next.setHours(0, 0, 0, 0);
			return next;
		}

		if (frequency === "monthly") {
			const month = now.getMonth() + 1;
			const targetDay = Math.min(commissionDay || 1, new Date(now.getFullYear(), month, 0).getDate());
			next.setMonth(month, 1);
			next.setDate(targetDay);
			next.setHours(0, 0, 0, 0);
			if (next <= now) {
				next.setMonth(next.getMonth() + 1, 1);
				next.setDate(Math.min(commissionDay || 1, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
			}
			return next;
		}

		return next;
	};

	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date();
			const target = getNextResetDate();
			const diff = target.getTime() - now.getTime();

			const ready = diff <= 0;

			setIsReady(ready);

			// 🔥 trigger callback ONLY when state changes
			if (lastState.current !== ready) {
				lastState.current = ready;
				onReadyChange?.(ready);
			}

			if (ready) {
				setTimeLeft("Available Now");
				return;
			}

			const seconds = Math.floor(diff / 1000) % 60;
			const minutes = Math.floor(diff / (1000 * 60)) % 60;
			const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const weeks = Math.floor(days / 7);
			const months = Math.floor(days / 30);

			let display = "";

			if (months > 0) display += `${months}m `;
			if (weeks > 0) display += `${weeks}w `;
			if (days > 0) display += `${days % 7}d `;
			if (hours > 0) display += `${hours}h `;
			display += `${minutes}m ${seconds}s`;

			setTimeLeft(display);
		}, 1000);

		return () => clearInterval(interval);
	}, [commissionDay, frequency, onReadyChange]);

	return (
		<div
			className={`relative rounded-xl p-4 border text-center transition-all
      ${
				isReady
					? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-900"
					: "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950 dark:border-pink-900"
			}`}
		>
			{!isReady && (
				<div className="absolute inset-0 rounded-xl animate-pulse opacity-20 bg-pink-400" />
			)}

			<p className="text-xs uppercase text-white tracking-wide opacity-50">
				{isReady ? "Payment Available" : "Next Payment in"}
			</p>

			<p className="text-2xl font-semibold text-white tracking-tight">{timeLeft}</p>
		</div>
	);
}
