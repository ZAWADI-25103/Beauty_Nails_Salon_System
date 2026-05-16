"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { Logo } from "../Logo";

export default function ResetPasswordComponent() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { mutate, isPending } = useResetPassword();
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		if (!token) {
			toast.error("Missing reset token");
			return;
		}

		mutate(
			{ token, newPassword: password },
			{
				onSuccess: () => {
					toast.success("Password reset successfully");
					setTimeout(() => {
						router.push("/auth/login");
					}, 2000);
				},
			},
		);
	};

	return (
		<div className="min-h-screen py-12 sm:py-24 flex items-center bg-background dark:bg-gray-950">
			<div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
				<div className="text-center mb-6 sm:mb-8">
					<Link
						href="/"
						className="inline-flex items-center justify-center mb-4 sm:mb-6"
					>
						<Logo width={250} height={70} />
					</Link>
					<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
						Reset Your Password
					</h1>
					<p className="text-lg sm:text-base text-gray-600 dark:text-gray-400">
						Enter your new password
					</p>
				</div>
			
			<Card className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-gray-950 shadow-xl rounded-2xl border border-pink-100 dark:border-pink-900/30">

				<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
					<div>
						<Label
							htmlFor="password"
							className="text-base sm:text-lg text-gray-700 dark:text-gray-300"
						>
							New Password
						</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							className="mt-1 rounded-xl py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
						/>
					</div>

					<div>
						<Label
							htmlFor="confirmPassword"
							className="text-base sm:text-lg text-gray-700 dark:text-gray-300"
						>
							Confirm Password
						</Label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="••••••••"
							required
							className="mt-1 rounded-xl py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
						/>
					</div>

					<Button
						type="submit"
						disabled={isPending}
						className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium"
					>
						{isPending
							? "Resetting..."
							: "Reset Password"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<button
						onClick={() => router.push("/auth/login")}
						className="text-base sm:text-lg text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to login
					</button>
				</div>
			</Card>
			</div>
		</div>
	);
}
