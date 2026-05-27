"use client";

import {
	Award,
	Cake,
	Calendar,
	Gift,
	Mail,
	MessageSquare,
	Send,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Client } from "@/lib/api/clients";
import { LoyaltyTransaction, Referral } from "@/lib/api/loyalty";
import { DiscountCode, type MarketingCampaign } from "@/lib/api/marketing";
import type { Notification } from "@/lib/api/notifications";
import { useClients } from "@/lib/hooks/useClients";
import { useLoyalty, useReferral } from "@/lib/hooks/useLoyalty";
import { useCampaigns, useDiscounts } from "@/lib/hooks/useMarketing";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { CreateCampaignModal } from "./modals/CreateCampaignModal";
import { CreateLoyaltyProgramModal } from "./modals/CreateLoyaltyProgramModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

export default function MarketingLoyalty() {
	const [emailSubject, setEmailSubject] = useState("");
	const [emailBody, setEmailBody] = useState("");
	const [smsMessage, setSmsMessage] = useState("");

	// Fetch data using hooks
	const {
		campaigns: apiCampaigns = [],
		isLoading: campaignsLoading,
		error: campaignsError,
	} = useCampaigns();
	const {
		discounts: apiDiscounts = [],
		isLoading: discountsLoading,
		error: discountsError,
	} = useDiscounts();
	const {
		points: loyaltyPoints,
		isLoading: loyaltyLoading,
		error: loyaltyError,
	} = useLoyalty();
	const {
		referrals: userReferralsCount,
		isLoading: referralLoading,
		error: referralError,
	} = useReferral();
	const {
		clients: allClients = [],
		isLoading: clientsLoading,
		error: clientsError,
	} = useClients(); // Fetch all clients
	const { createNotification } = useNotifications(); // Hook to create notifications

	const loyaltyRules = {
		pointsPerSpend: 1,
		appointmentsForReward: 5,
		referralsForReward: 5,
		rewards: [
			{ points: 100, reward: "Manucure gratuite" },
			{ points: 250, reward: "Extension cils gratuite" },
			{ points: 500, reward: "50% sur tous services" },
			{ points: 1000, reward: "Journée beauté complète gratuite" },
		],
	};
	const today = new Date();
	const nextWeek = new Date(today);
	nextWeek.setDate(today.getDate() + 7);

	const birthdayClients = allClients
		.filter((client) => {
			if (!client.birthday) return false; // Skip clients without birthday
			const birthdate = client.birthday.split("T")[0]; // Get date part if it's a full datetime
			const [year, month, day] = birthdate.split("-").map(Number);
			if (isNaN(month) || isNaN(day)) return false; // Invalid date format

			const birthdayThisYear = new Date(today.getFullYear(), month - 1, day); // month is 0-indexed
			const birthdayNextYear = new Date(
				today.getFullYear() + 1,
				month - 1,
				day,
			);

			// Check if birthday falls within the next week considering year wrap-around
			return (
				(birthdayThisYear >= today && birthdayThisYear <= nextWeek) ||
				(birthdayNextYear >= today && birthdayNextYear <= nextWeek)
			);
		})
		.map((client) => ({
			name: client.user?.name || "Client Inconnu",
			birthday: client.birthday
				? new Date(client.birthday).toLocaleDateString("fr-FR", {
						day: "numeric",
						month: "long",
					})
				: "N/A",
			phone: client.user?.phone || "N/A",
			email: client.user?.email || "N/A",
			userId: client.userId, // Needed for sending notification
		}));

	const topReferrers = allClients.map((client) => {
		return {
			name: client.user?.name || "Client Inconnu",
			referrals: client.referrals,
			reward: `${client.referralsReceived.filter((r) => r.status === "rewarded").length}/${loyaltyRules.referralsForReward}`, // Placeholder for actual calculation
			status: client.referralsReceived.some((r) => r.status === "rewarded")
				? "eligible"
				: "progress",
			userId: client.userId,
		};
	});

	const totalUsers = allClients.length;
	const vipUsers = allClients.filter((c) => c.tier === "VIP").length;
	const inactiveUsers = allClients.filter(
		(c) => c.user?.isActive !== true,
	).length;

	const clientsCount = allClients.length;
	const rewardedClientsCount = allClients.reduce(
		(count, client) =>
			count +
			(client.referralsReceived.some((r) => r.status === "rewarded") ? 1 : 0),
		0,
	);

	const handleSendBirthdayNotification = (
		client: (typeof birthdayClients)[0],
		channel: "email" | "sms",
	) => {
		if (!client.userId) {
			console.error("Client userId is missing for notification.");
			return;
		}

		const title = `Joyeux Anniversaire ${client.name}!`;
		const message = `Chère ${client.name}, Joyeux Anniversaire! 🎉 Profitez de 20% de réduction sur tous nos services ce mois-ci.`; // Use default message or customize
		const type: Notification["type"] =
			channel === "email" ? "marketing" : "marketing"; // Could differentiate types

		createNotification({
			userId: client.userId,
			type,
			title,
			message,
		});
	};
	// --- End Handler ---

	// --- Handler for sending referral notifications ---
	const handleSendReferralNotification = (
		referrer: (typeof topReferrers)[0],
		channel: "email" | "sms",
	) => {
		if (!referrer.userId) {
			console.error("Referrer userId is missing for notification.");
			return;
		}

		const title = `Thank you for your Referral!`;
		const message = `Hello ${referrer.name}, thank you for referring ${referrer.referrals} personnes. Keep it up!`; // Customize message
		const type: Notification["type"] =
			channel === "email" ? "marketing" : "loyalty_reward"; // Could differentiate types

		createNotification({
			userId: referrer.userId,
			type,
			title,
			message,
		});
	};
	// --- End Handler ---

	if (
		campaignsLoading ||
		loyaltyLoading ||
		referralLoading ||
		discountsLoading ||
		clientsLoading
	) {
		return <div>Loading...</div>; // Implement a proper loading UI
	}

	if (campaignsError) {
		console.error("Error fetching campaigns:", campaignsError);
		return <div>Error loading campaigns.</div>;
	}
	if (loyaltyError) {
		console.error("Error fetching loyalty ", loyaltyError);
		return <div>Error loading loyalty data.</div>;
	}
	if (referralError) {
		console.error("Error fetching referral ", referralError);
		return <div>Error loading referral data.</div>;
	}
	if (discountsError) {
		console.error("Error fetching discounts:", discountsError);
		return <div>Error loading discounts.</div>;
	}
	if (clientsError) {
		console.error("Error fetching clients:", clientsError);
		return <div>Error loading clients.</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h2 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
					Marketing & Loyalty
				</h2>
			</div>

			<p className="dark:text-pink-400 text-xs sm:text-xs">
				{"swipe <--- | --->"}
			</p>

			<Tabs defaultValue="loyalty" className="space-y-6">
				<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
					<TabsTrigger
						value="loyalty"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Loyalty Program
					</TabsTrigger>
					<TabsTrigger
						value="campaigns"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Campaigns
					</TabsTrigger>
					<TabsTrigger
						value="birthday"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Birthdays
					</TabsTrigger>
					<TabsTrigger
						value="referral"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Referrals
					</TabsTrigger>
					<TabsTrigger
						value="broadcast"
						className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
					>
						Bulk Messaging
					</TabsTrigger>
				</TabsList>

				{/* Loyalty Program Tab */}
				<TabsContent value="loyalty">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
							<div className="flex items-center gap-4 mb-8">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
									<Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Current Program
								</h3>
							</div>

							<div className="space-y-4">
								<Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 border border-purple-100 dark:border-purple-900/30 p-4 sm:p-5 rounded-2xl">
									<p className="text-[10px] sm:text-base text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
										Points per Spend
									</p>
									<p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
										{loyaltyRules.pointsPerSpend} point per 1,000 CDF spent
									</p>
								</Card>

								<Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 border border-blue-100 dark:border-blue-900/30 p-4 sm:p-5 rounded-2xl">
									<p className="text-[10px] sm:text-base text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
										Reward by Visits
									</p>
									<p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
										Free service after {loyaltyRules.appointmentsForReward}{" "}
										appointments
									</p>
								</Card>

								<Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 border border-green-100 dark:border-green-900/30 p-4 sm:p-5 rounded-2xl">
									<p className="text-[10px] sm:text-base text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
										Referral Reward
									</p>
									<p className="text-base sm:text-2xl font-black text-gray-900 dark:text-gray-100">
										Free service after {loyaltyRules.referralsForReward}{" "}
										referrals
									</p>
								</Card>
							</div>

							<CreateLoyaltyProgramModal
								trigger={
									<Button className="w-full mt-8 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6 sm:py-7 text-lg sm:text-base shadow-lg shadow-pink-500/20 transition-all">
										Edit Program
									</Button>
								}
							/>
						</Card>

						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
							<div className="flex items-center gap-4 mb-8">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/20">
									<Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Reward Tiers
								</h3>
							</div>

							<div className="space-y-4">
								{loyaltyRules.rewards.map((reward, idx) => (
									<Card
										key={idx}
										className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 p-4 sm:p-5 rounded-2xl hover:shadow-md transition-all"
									>
										<div className="flex items-center justify-between gap-4">
											<div>
												<p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
													{reward.reward}
												</p>
												<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-1">
													<Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
													{reward.points} points required
												</p>
											</div>
											<Badge className="bg-amber-500 dark:bg-amber-600 text-white border-0 font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-amber-500/20 text-[10px] sm:text-base">
												{reward.points} PTS
											</Badge>
										</div>
									</Card>
								))}
							</div>

							<CreateLoyaltyProgramModal
								trigger={
									<Button
										variant="outline"
										className="w-full mt-8 rounded-full py-6 sm:py-7 text-lg sm:text-base dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all"
									>
										+ Add Tier
									</Button>
								}
							/>
						</Card>

						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-2">
							<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
								Loyalty Program Statistics
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
								<div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
									<Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
									<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
										{allClients.length}
									</p>
									<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mt-2 tracking-widest">
										Active Members
									</p>
								</div>
								<div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
									<Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
									<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
										{loyaltyPoints}
									</p>
									<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mt-2 tracking-widest">
										Total Points
									</p>
								</div>
								<div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
									<Gift className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
									<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
										38
									</p>
									<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mt-2 tracking-widest">
										Redeemed
									</p>
								</div>
								<div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center">
									<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
									<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
										+15%
									</p>
									<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mt-2 tracking-widest">
										Retention
									</p>
								</div>
							</div>
						</Card>
					</div>
				</TabsContent>

				{/* Campaigns Tab */}
				<TabsContent value="campaigns">
					<div className="space-y-6">
						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Marketing Campaigns
								</h3>
								<CreateCampaignModal
									trigger={
										<Button className="w-full sm:w-auto bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-5 sm:py-6 px-8 transition-all shadow-md text-lg sm:text-base">
											+ New Campaign
										</Button>
									}
								/>
							</div>

							<div className="space-y-6">
								{apiCampaigns.map((campaign: MarketingCampaign) => (
									<Card
										key={campaign.id}
										className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all"
									>
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
											<div>
												<div className="flex flex-wrap items-center gap-3 mb-2">
													<h4 className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
														{campaign.name}
													</h4>
													<Badge
														className={`${
															campaign.status === "sent"
																? "bg-green-500 dark:bg-green-600"
																: campaign.status === "sending"
																	? "bg-blue-500 dark:bg-blue-600"
																	: campaign.status === "scheduled"
																		? "bg-amber-500 dark:bg-amber-600"
																		: "bg-gray-500 dark:bg-gray-600"
														} text-white border-0 px-3 text-[10px] sm:text-base`}
													>
														{campaign.status === "sent"
															? "Sent"
															: campaign.status === "sending"
																? "Sending"
																: campaign.status === "scheduled"
																	? "Scheduled"
																	: "Draft"}
													</Badge>
												</div>
												<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
													<span className="flex items-center gap-1.5">
														{campaign.type === "email" ? (
															<Mail className="w-3.5 h-3.5" />
														) : (
															<MessageSquare className="w-3.5 h-3.5" />
														)}
														{campaign.type === "email"
															? "📧 Email"
															: campaign.type === "sms"
																? "📱 SMS"
																: "📧/📱 Both"}
													</span>
													<span className="text-gray-300 dark:text-gray-700 hidden sm:inline">
														•
													</span>
													<span className="flex items-center gap-1.5">
														<Calendar className="w-3.5 h-3.5" />
														{campaign.sentDate
															? new Date(campaign.sentDate).toLocaleDateString()
															: campaign.scheduledDate
																? new Date(
																		campaign.scheduledDate,
																	).toLocaleDateString()
																: "N/A"}
													</span>
												</p>
											</div>
											<div className="flex gap-2 w-full sm:w-auto">
												<Button
													size="sm"
													variant="outline"
													className="flex-1 sm:flex-none rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-base sm:text-lg"
												>
													View Details
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="flex-1 sm:flex-none rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-base sm:text-lg"
												>
													Duplicate
												</Button>
											</div>
										</div>

										{/* ... rest of the campaign stats remain the same ... */}
									</Card>
								))}
							</div>
						</Card>

						{/* Stats Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
							{/* ... existing stats cards with translated labels ... */}
						</div>
					</div>
				</TabsContent>

				{/* Birthday Tab */}
				{/* Birthday Tab */}
				<TabsContent value="birthday">
					<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
							<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
								<Cake className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
							</div>
							<div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-1">
									Upcoming Birthdays
								</h3>
								<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
									Automatically send personalized birthday messages
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
							{birthdayClients.map((client, idx) => (
								<Card
									key={idx}
									className="p-4 bg-linear-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 border border-pink-100 dark:border-pink-900/30 rounded-2xl hover:shadow-md transition-all"
								>
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-base sm:text-xl shrink-0">
												{client.name.charAt(0)}
											</div>
											<div>
												<p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-0.5">
													{client.name}
												</p>
												<p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
													<span className="text-pink-500">
														🎂 {client.birthday}
													</span>
												</p>
											</div>
										</div>
										<div className="flex gap-2 w-full sm:w-auto">
											<Button
												size="sm"
												className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full py-4 sm:py-5 px-4 transition-all shadow-md text-base"
												onClick={() =>
													handleSendBirthdayNotification(client, "email")
												}
											>
												<Mail className="w-3.5 h-3.5 mr-2" />
												Email
											</Button>
											<Button
												size="sm"
												className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-4 sm:py-5 px-4 transition-all shadow-md text-base"
												onClick={() =>
													handleSendBirthdayNotification(client, "sms")
												}
											>
												<MessageSquare className="w-3.5 h-3.5 mr-2" />
												SMS
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>

						<Card className="p-4 sm:p-8 bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/50 border border-amber-100 dark:border-amber-900/30 rounded-2xl sm:rounded-3xl shadow-sm">
							<h4 className="text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
								<Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
								Default Birthday Message
							</h4>
							<Textarea
								placeholder="Dear [NAME], Happy Birthday! 🎉 Enjoy 20% off all services this month. The Beauty Nails team wishes you a wonderful day!"
								rows={4}
								className="mb-6 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:ring-amber-500 p-4 text-lg sm:text-base"
							/>
							<div className="flex flex-col sm:flex-row gap-4">
								<Button className="flex-1 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-500 text-white rounded-full py-5 sm:py-6 transition-all shadow-lg shadow-pink-500/20 text-lg sm:text-base">
									Save Message
								</Button>
								<Button
									variant="outline"
									className="flex-1 sm:flex-none rounded-full py-5 sm:py-6 px-8 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base"
								>
									Preview
								</Button>
							</div>
						</Card>
					</Card>
				</TabsContent>

				{/* Referral Tab */}
				<TabsContent value="referral">
					<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
							<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
								<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
							</div>
							<div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-1">
									Referral Program
								</h3>
								<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
									Reward your clients who recommend your services
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
							{topReferrers.map((referrer, idx) => (
								<Card
									key={idx}
									className={`border border-opacity-30 p-4 sm:p-5 rounded-2xl hover:shadow-md transition-all ${
										referrer.status === "vip"
											? "bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900"
											: referrer.status === "eligible"
												? "bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900"
												: "bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900"
									}`}
								>
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div>
											<p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
												{referrer.name}
											</p>
											<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2">
												<Users className="w-3.5 h-3.5 text-gray-400" />
												{referrer.referrals} referrals
											</p>
										</div>
										<div className="text-left sm:text-right w-full sm:w-auto">
											<Badge
												className={`${
													referrer.status === "vip"
														? "bg-amber-500 dark:bg-amber-600"
														: referrer.status === "eligible"
															? "bg-green-500 dark:bg-green-600"
															: "bg-blue-500 dark:bg-blue-600"
												} text-white border-0 mb-2 px-3 text-[10px] sm:text-base`}
											>
												{referrer.status === "vip"
													? "VIP"
													: referrer.status === "eligible"
														? "Eligible"
														: "In Progress"}
											</Badge>
											<p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">
												{referrer.reward}
											</p>
										</div>
									</div>
									<div className="flex gap-2 mt-4">
										<Button
											size="sm"
											className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full py-3 sm:py-4 px-4 transition-all shadow-md text-base"
											onClick={() =>
												handleSendReferralNotification(referrer, "email")
											}
										>
											<Mail className="w-3.5 h-3.5 mr-2" />
											Email
										</Button>
										<Button
											size="sm"
											className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-3 sm:py-4 px-4 transition-all shadow-md text-base"
											onClick={() =>
												handleSendReferralNotification(referrer, "sms")
											}
										>
											<MessageSquare className="w-3.5 h-3.5 mr-2" />
											SMS
										</Button>
									</div>
								</Card>
							))}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
							<div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/30 text-center">
								<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mb-2 tracking-widest">
									Total Referrals
								</p>
								<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
									{userReferralsCount}
								</p>
							</div>
							<div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
								<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mb-2 tracking-widest">
									New Clients
								</p>
								<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
									{clientsCount}
								</p>
								<p className="text-[10px] text-green-600 mt-2">
									Conversion: 72%
								</p>
							</div>
							<div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/30 text-center">
								<p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase mb-2 tracking-widest">
									Rewards Given
								</p>
								<p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
									{rewardedClientsCount}
								</p>
								<p className="text-[10px] text-gray-500 mt-2">This month</p>
							</div>
						</div>
					</Card>
				</TabsContent>

				{/* Broadcast Tab */}
				<TabsContent value="broadcast">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Email Broadcast */}
						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
							<div className="flex items-center gap-4 mb-8">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
									<Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Bulk Email
								</h3>
							</div>

							<div className="space-y-6">
								<div>
									<label className="block text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest">
										Recipients
									</label>
									<div className="flex flex-wrap gap-2">
										<Badge className="bg-blue-500 dark:bg-blue-600 text-white border-0 py-1.5 px-3 text-[10px] sm:text-base">
											All Clients ({totalUsers})
										</Badge>
										<Badge
											variant="outline"
											className="border-purple-200 dark:border-purple-900 text-purple-600 dark:text-pink-400 py-1.5 px-3 text-[10px] sm:text-base"
										>
											VIP Members ({vipUsers})
										</Badge>
										<Badge
											variant="outline"
											className="border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 py-1.5 px-3 text-[10px] sm:text-base"
										>
											Inactive ({inactiveUsers})
										</Badge>
									</div>
								</div>

								<div>
									<label className="block text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">
										Email Subject
									</label>
									<Input
										placeholder="Ex: Special offer this month..."
										value={emailSubject}
										onChange={(e) => setEmailSubject(e.target.value)}
										className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 py-5 sm:py-6 text-lg sm:text-base"
									/>
								</div>

								<div>
									<label className="block text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">
										Message
									</label>
									<Textarea
										placeholder="Write your email content here..."
										rows={8}
										value={emailBody}
										onChange={(e) => setEmailBody(e.target.value)}
										className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 p-4 text-lg sm:text-base"
									/>
								</div>

								<div className="flex flex-col sm:flex-row gap-4">
									<Button
										size="sm"
										className="flex-1 bg-linear-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all text-lg sm:text-base"
									>
										<Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
										Send Now
									</Button>
									<Button
										variant="outline"
										className="flex-1 sm:flex-none rounded-full px-8 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base"
									>
										Schedule
									</Button>
								</div>
							</div>
						</Card>

						{/* SMS Broadcast */}
						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
							<div className="flex items-center gap-4 mb-8">
								<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
									<MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>
								<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
									Bulk SMS
								</h3>
							</div>

							<div className="space-y-6">
								<div>
									<label className="block text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest">
										Recipients
									</label>
									<div className="flex flex-wrap gap-2">
										<Badge className="bg-purple-500 dark:bg-purple-600 text-white border-0 py-1.5 px-3 text-[10px] sm:text-base">
											All Clients ({totalUsers})
										</Badge>
										<Badge
											variant="outline"
											className="border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 py-1.5 px-3 text-[10px] sm:text-base"
										>
											Appointments Tomorrow (12)
										</Badge>
									</div>
								</div>

								<div>
									<label className="block text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest">
										SMS Message
									</label>
									<Textarea
										placeholder="Your SMS message (max 160 characters)..."
										rows={6}
										maxLength={160}
										value={smsMessage}
										onChange={(e) => setSmsMessage(e.target.value)}
										className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 p-4 text-lg sm:text-base"
									/>
									<p className="text-[10px] sm:text-base text-right text-gray-500 mt-2 font-medium">
										{smsMessage.length}/160 characters
									</p>
								</div>

								<div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
									<p className="text-base sm:text-lg text-amber-700 dark:text-amber-400 leading-relaxed">
										<span className="mr-1">💡 Tip:</span>
										SMS have a 98% open rate compared to emails. Keep it short
										and impactful!
									</p>
								</div>

								<div className="flex flex-col sm:flex-row gap-4">
									<Button className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-pink-500/20 transition-all text-lg sm:text-base">
										<Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
										Send SMS
									</Button>
									<Button
										variant="outline"
										className="flex-1 sm:flex-none rounded-full px-8 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all text-lg sm:text-base"
									>
										Preview
									</Button>
								</div>
							</div>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
