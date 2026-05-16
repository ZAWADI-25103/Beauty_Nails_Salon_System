"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForgotPassword } from "@/lib/hooks/useAuth";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ForgotPasswordForm() {
	const [email, setEmail] = useState("");
	const { mutate, isPending } = useForgotPassword();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutate(email);
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
							Enter your email address and we'll send you a link to reset your password.
						</p>
				</div>
				<Card className="p-6 sm:p-8 border-b border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950 shadow-2xl rounded-3xl">

					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						<div>
							<Label
								htmlFor="email"
								className="text-base sm:text-lg text-gray-700 dark:text-gray-300"
							>
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="votre@email.com"
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
								? "Sending..."
								: "Send Reset Link"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<Link
							href="/auth/login"
							className="text-base sm:text-lg text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to login
						</Link>
					</div>
				</Card>
			</div>
		</div>
	);
}
