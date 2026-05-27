"use client";

import { Award, Star } from "lucide-react";
import Link from "next/link";
import { useMemberships } from "@/lib/hooks/useMemberships";
import LoaderBN from "../Loader-BN";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function MembershipsPage() {
	const { memberships, isLoading, error } = useMemberships();

	if (isLoading) return <LoaderBN />;
	if (error) return <div>Error loading memberships: {error.message}</div>;

	// Sort memberships by display order if available, otherwise by price or name
	const sortedMemberships = [...memberships].sort(
		(a, b) => a.displayOrder - b.displayOrder,
	);

	return (
		<div className="min-h-screen bg-background dark:bg-gray-950">
			{/* Hero Section */}
			<section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full mb-4">
						<Award className="w-4 h-4" />
						<span className="text-lg">Premium Memberships</span>
					</div>

					<h1 className="text-4xl sm:text-5xl md:text-6xl text-gray-900 dark:text-gray-100 mb-6">
						Join Our Circle of Privileged Clients
					</h1>

					<p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Save up to 30% on your favorite treatments and enjoy exclusive
						benefits with our membership plans.
					</p>
				</div>
			</section>

			{/* Membership Plans */}
			<section className="py-16 bg-background dark:bg-gray-950">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{sortedMemberships.map((membership, index) => {
							const colorClasses = [
								"from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-2 border-purple-300 dark:border-purple-900",
								"from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-300 dark:border-amber-900",
								"from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-2 border-blue-300 dark:border-blue-900",
							][index % 3];

							const badgeColor = [
								"bg-purple-500",
								"bg-amber-500",
								"bg-blue-500",
							][index % 3];

							const linearBg = [
								"bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
								"bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
								"bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
							][index % 3];

							return (
								<Card
									key={membership.id}
									className={`bg-linear-to-br ${colorClasses} shadow-2xl rounded-3xl overflow-hidden relative transform hover:scale-[1.02] transition-transform ${
										index === 1
											? "ring-4 ring-amber-400 dark:ring-amber-600 -translate-y-2"
											: ""
									}`}
								>
									{/* Popular Badge */}
									{index === 1 && (
										<div className="absolute top-0 right-0 bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-6 py-2 rounded-bl-3xl z-10">
											<span className="flex items-center text-lg">
												<Star className="w-4 h-4 mr-1" />
												Popular
											</span>
										</div>
									)}

									<div className="p-8">
										<div className="flex justify-between items-start mb-6">
											<div>
												<Badge className={`${badgeColor} text-white`}>
													{membership.name}
												</Badge>

												<h3 className="text-3xl text-gray-900 dark:text-gray-100 mt-4 mb-2">
													{membership.name}
												</h3>

												<div className="flex items-baseline mb-6">
													<span className="text-5xl text-gray-900 dark:text-gray-100">
														{membership.price.toLocaleString()}
													</span>

													<span className="text-xl text-gray-600 dark:text-gray-300 ml-2">
														CDF
													</span>
												</div>
											</div>
										</div>

										<ul className="space-y-4 mb-8">
											{membership.benefits.map((benefit: any, idx: any) => (
												<li key={idx} className="flex items-start">
													<div className="w-6 h-6 rounded-full bg-pink-500 dark:bg-pink-600 flex items-center justify-center mr-3 shrink-0">
														<span className="text-white text-base">✓</span>
													</div>

													<span className="text-gray-700 dark:text-gray-300">
														{benefit}
													</span>
												</li>
											))}
										</ul>

										<Link href="/auth/signup">
											<Button
												className={`w-full ${linearBg} text-white rounded-full py-4 text-lg shadow-md`}
											>
												{membership.name.includes("Premium")
													? "Become a Premium Member"
													: "Subscribe Now"}
											</Button>
										</Link>
									</div>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* Benefits Comparison */}
			<section className="py-16 bg-gray-50 dark:bg-gray-900">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100 mb-12 text-center">
						Benefits Comparison
					</h2>

					<Card className="bg-white dark:bg-gray-800 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-3xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-linear-to-r from-pink-50 to-amber-50 dark:from-gray-700 dark:to-gray-800">
									<tr>
										<th className="text-left py-4 px-6 text-gray-900 dark:text-gray-100">
											Benefits
										</th>

										{sortedMemberships.map((m, idx) => (
											<th
												key={idx}
												className="text-center py-4 px-6 text-gray-900 dark:text-gray-100"
											>
												{m.name}
											</th>
										))}
									</tr>
								</thead>

								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									<tr>
										<td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
											Service Discounts
										</td>

										{sortedMemberships.map((m, idx) => (
											<td key={idx} className="py-4 px-6 text-center">
												{m.discount}%
											</td>
										))}
									</tr>

									<tr>
										<td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
											Priority Access
										</td>

										{sortedMemberships.map((m, idx) => (
											<td key={idx} className="py-4 px-6 text-center">
												{m.benefits.some((b: any) =>
													b.toLowerCase().includes("priority"),
												)
													? "✓"
													: "—"}
											</td>
										))}
									</tr>

									<tr>
										<td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
											Bonus Loyalty Points
										</td>

										{sortedMemberships.map((m, idx) => (
											<td key={idx} className="py-4 px-6 text-center">
												{m.benefits.some(
													(b: any) =>
														b.toLowerCase().includes("point") &&
														b.toLowerCase().includes("bonus"),
												)
													? "2x"
													: "1x"}
											</td>
										))}
									</tr>

									<tr>
										<td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
											Exclusive Services
										</td>

										{sortedMemberships.map((m, idx) => (
											<td key={idx} className="py-4 px-6 text-center">
												{m.benefits.some((b: any) =>
													b.toLowerCase().includes("exclusive"),
												)
													? "✓"
													: "—"}
											</td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
					</Card>
				</div>
			</section>

			{/* FAQ */}
			<section className="py-16 bg-background dark:bg-gray-950">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100 mb-12 text-center">
						Frequently Asked Questions
					</h2>

					<Accordion type="single" collapsible className="w-full space-y-4">
						<AccordionItem value="item-1">
							<AccordionTrigger>How does the membership work?</AccordionTrigger>

							<AccordionContent>
								The membership is valid for the specified duration (for example,
								30 days). You enjoy all included benefits during that period.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value="item-2">
							<AccordionTrigger>Can I cancel my membership?</AccordionTrigger>

							<AccordionContent>
								Yes, you can cancel your membership at any time. Your benefits
								will remain active until the end of the current billing period.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value="item-3">
							<AccordionTrigger>How can I buy a membership?</AccordionTrigger>

							<AccordionContent>
								Log into your account, select your preferred membership plan,
								and proceed with secure online payment or purchase directly
								in-store.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value="item-4">
							<AccordionTrigger>What are loyalty points?</AccordionTrigger>

							<AccordionContent>
								Loyalty points are earned with every visit and can be redeemed
								for discounts or free services through our rewards program.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 bg-linear-to-r from-pink-500 to-purple-500 dark:from-pink-700 dark:to-purple-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">
						Transform Your Beauty Routine
					</h2>

					<p className="text-lg text-pink-100 max-w-2xl mx-auto mb-8">
						Become a member today and enjoy a personalized beauty experience.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/auth/signup">
							<Button className="bg-white text-pink-600 hover:bg-gray-100 rounded-full px-8 py-6 text-base sm:text-lg shadow-md">
								Become a Member
							</Button>
						</Link>

						<Link href="/contact">
							<Button
								variant="secondary"
								className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base sm:text-lg"
							>
								Contact Us
							</Button>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
