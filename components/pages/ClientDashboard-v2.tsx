"use client";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Award,
	Bell,
	Cake,
	CalendarIcon,
	CheckCircle,
	ChevronRight,
	Clock,
	CreditCard,
	Crown,
	DollarSign,
	Eye,
	Gift,
	Info,
	Loader2,
	Mail,
	MapPin,
	MessageSquare,
	Package,
	PartyPopper,
	Phone,
	Plus,
	Scissors,
	Share2,
	Sparkles,
	Star,
	TrendingUp,
	User,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Appointment } from "@/lib/api/appointments";
import {
	useAppointments,
	useAvailableSlots,
} from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClient, useClients } from "@/lib/hooks/useClients";
import { useLoyalty, useReferral } from "@/lib/hooks/useLoyalty";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { usePackages } from "@/lib/hooks/usePackages";
import { useReviews } from "@/lib/hooks/useReview";
import { useClientReferrals } from "@/lib/hooks/useServices";
import AppointmentCountdown from "../AppointmentCountdown";
import ClientModalTrigger from "../ClientModalTrigger";
import LoaderBN from "../Loader-BN";
import PackageCard from "../PackageCard";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import TasksManagement from "../TasksManagement";

export default function ClientDashboardV2() {
	const [notificationOpen, setNotificationOpen] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const [rating, setRating] = useState(0);
	const [reviewText, setReviewText] = useState("");
	const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
	const [selectedWorkerName, setSelectedWorkerName] = useState<string | null>(
		null,
	);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTime, setSelectedTime] = useState<string>("");
	const router = useRouter();
	// Get authenticated user
	const { user, isLoading: isAuthLoading } = useAuth();
	const { data: referrals, isLoading } = useClientReferrals(
		user?.clientProfile?.id,
	);
	const { applyReferralBonus } = useReferral();
	const { applyLoyaltyBonus, applyFreeService } = useLoyalty();
	const { createNotification } = useNotifications();

	// API hook
	const { data: c } = useClient(user?.clientProfile?.id!);

	// Use API data first, fallback to mock only when showMock is true
	const selectedClient = c
		? {
				id:
					c.id ||
					c.user?.id ||
					String(c.user?.name ?? c.user?.email ?? "unknown"),
				userId: c.userId || c.user?.id || undefined,
				name: c.user?.name || c.user?.email || "Platform User",
				phone: c.user?.phone || "",
				email: c.user?.email || "",
				birthday: c.birthday
					? new Date(c.birthday).toISOString().split("T")[0]
					: undefined,
				address: c.address || undefined,
				notes: c.notes || undefined,
				totalAppointments: c.totalAppointments || 0,
				totalSpent:
					typeof c.totalSpent === "number"
						? `${c.totalSpent}`
						: c.totalSpent || "0",
				loyaltyPoints: c.loyaltyPoints || 0,
				freeServiceCount: c.freeServiceCount || 0,
				giftCardCount: c.giftCardCount || 0,
				refBonus: c.refBonus || 0,
				membershipStatus: c.tier || "Standard",
				lastVisit: (c as any).lastVisit || undefined,
				preferences:
					typeof c.preferences === "string"
						? c.preferences
						: JSON.stringify(c.preferences || ""),
				allergies: c.allergies || undefined,
				favoriteServices: c.favoriteServices || [],
				prepaymentBalance: c.prepaymentBalance ?? "0",
				giftCardBalance: c.giftCardBalance ?? "0",
				referrals: c.referrals || 0,
			}
		: {
				id: "unknown",
				userId: undefined,
				name: "Platform User",
				phone: "",
				email: "",
				birthday: undefined,
				address: undefined,
				totalAppointments: 0,
				totalSpent: "0",
				loyaltyPoints: 0,
				freeServiceCount: 0,
				giftCardCount: 0,
				refBonus: 0,
				membershipStatus: "Standard",
				lastVisit: undefined,
				preferences: "",
				allergies: undefined,
				favoriteServices: [],
				prepaymentBalance: "0",
				giftCardBalance: "0",
				referrals: 0,
			};

	// Get appointments
	const {
		appointments = [],
		isLoading: isAppointmentsLoading,
		cancelAppointment,
		updateStatus,
		rescheduleAppointment,
	} = useAppointments({
		clientId: user?.clientProfile?.id,
	});

	// Fetch appointments that were booked using packages
	const { packages: availablePackages = [], isLoading: isPackagesLoading } =
		usePackages({
			active: true, // Only fetch active packages for booking purposes
		});

	const {
		appointments: packageAppointments = [],
		isLoading: isPackageAppointmentsLoading,
	} = useAppointments({
		clientId: user?.clientProfile?.id,
		hasPackage: true, // Custom filter param you'd add to your API
	});

	const isAppointmentMissed = (date: string | Date, time: string) => {
		const appointmentDateTime = new Date(date);
		const [hours, minutes] = time.split(":").map(Number);

		appointmentDateTime.setHours(hours);
		appointmentDateTime.setMinutes(minutes);
		appointmentDateTime.setSeconds(0);

		return appointmentDateTime < new Date();
	};

	const handleMissedAutoCancel = (appointment: Appointment) => {
		const amount = Number(appointment.price || 0);

		if (
			isAppointmentMissed(appointment.date, appointment.time) &&
			appointment.status === "cancelled"
		) {
			return;
		}
		cancelAppointment(
			{
				id: appointment.id,
				reason:
					"Missed appointment. The client did not show up within 10 minutes of the scheduled time.",
			},
			{
				onSuccess: () => {
					toast.info("Appointment automatically cancelled");

					// 🔔 Notification
					createNotification({
						userId: user?.id ?? "",
						type: "appointment_reminder",
						title: "Missed Appointment 😔",
						message: `Your appointment was automatically cancelled after 10 minutes of absence. The amount (${amount} CDF) can be converted to prepaid balance.`,
					});
				},
			},
		);
	};

	// Get loyalty data
	const {
		points: loyaltyPoints,
		tier: loyaltyTier,
		transactions = [],
		isLoading: isLoyaltyLoading,
	} = useLoyalty();

	// Get referral data
	const { referralCode = "" } = useReferral();

	const referralList = referrals || [];
	const refIds = referralList
		.filter((r) => r.status === "completed" || r.status === "pending")
		.map((r) => r.id);
	const successfulReferrals = referralList.filter(
		(r) => r.status === "completed" || r.status === "pending",
	).length;
	const canClaimBonus = successfulReferrals >= 5;

	// Get notifications
	const {
		notifications: notificationList = [],
		unreadCount = 0,
		markAsRead,
		markAllAsRead,
	} = useNotifications({ limit: 50 });

	const { createReview } = useReviews();

	const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
		date: selectedDate ? selectedDate.toString() : undefined,
		workerId: selectedWorker ? selectedWorker : "",
	});
	const weekDay = [
		"Sanday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	// Filter appointments
	const upcomingAppointments = appointments.filter(
		(apt) =>
			apt.status === "confirmed" &&
			new Date(apt.date).getDate() >= new Date().getDate(),
	);
	const ongoingAppointments = appointments.filter(
		(apt) => apt.status === "in_progress",
	);
	const missedAppointments = appointments.filter(
		(apt) =>
			isAppointmentMissed(apt.date, apt.time) &&
			(apt.status === "confirmed" || apt.status === "cancelled"),
	);

	const appointmentHistory = appointments.filter(
		(apt) => apt.status === "completed" || apt.status === "cancelled",
	);

	// Calculate stats
	const completedAppointments = appointments.filter(
		(apt) => apt.status === "completed",
	).length;
	const nextFreeService = Math.max(0, 5 - (completedAppointments % 5));
	const nextFreeReferral =
		Math.max(0, 5 - (referrals ? referrals?.length : 0)) || 0;

	// Handle review submission
	const handleSubmitReview = async () => {
		if (!selectedAppointment || rating === 0) {
			toast.error("Minimum rate is 1 star");
			return;
		}

		await createReview({
			appointmentId: selectedAppointment.id,
			rating: rating,
			comment: reviewText,
		});
		setReviewDialogOpen(false);
		setSelectedAppointment(null);
		setRating(0);
		setReviewText("");
	};

	const handleClaimRefBonus = () => {
		applyReferralBonus(refIds, {
			onSuccess: () => {
				// 1. Canva-style burst from the center
				confetti({
					particleCount: 150,
					spread: 70,
					origin: { y: 0.6 },
					colors: ["#8B5CF6", "#D946EF", "#3B82F6"], // Custom Canva-like palette
				});

				// 2. Immediate Toast Notification
				toast.success(`Congrats ! ${user?.name}! 🎉`, {
					description: "Enjoy 10% off on all our services",
					duration: 5000,
				});

				// 3. Your Database Notification
				createNotification({
					userId: user?.id ?? "",
					type: "marketing",
					title: `Congrats ! ${user?.name}!`,
					message: `Enjoy 10% off on all our services.`,
				});
			},
		});
	};

	const callApplyLoyaltyBonus = () => {
		applyLoyaltyBonus(selectedClient?.id, {
			onSuccess: () => {
				// 1. Canva-style burst
				confetti({
					particleCount: 150,
					spread: 70,
					origin: { y: 0.6 },
					colors: ["#8B5CF6", "#D946EF", "#3B82F6"],
				});

				// 2. Immediate Toast (UI Feedback)
				toast.success("Reward Unlocked! 🏆", {
					description: "Your loyalty bonus has been applied successfully.",
					duration: 5000,
					style: {
						border: "1px solid #8B5CF6",
						padding: "16px",
						color: "#1F2937",
					},

					// iconTheme: {
					//   primary: '#8B5CF6',
					//   secondary: '#FFFAEE',
					// },
				});

				// 3. Database Notification (Persistent History)
				createNotification({
					userId: user?.id ?? "",
					type: "loyalty_reward",
					title: `Congrats ${user?.name}! ✨`,
					message: `You used your points to get a loyalty bonus!`,
				});
			},
		});
	};

	const handleApplyLoyaltyBonus = () => {
		if (
			(selectedClient.loyaltyPoints === 500 && loyaltyPoints % 500 === 0) ||
			(selectedClient.loyaltyPoints === 1000 && loyaltyPoints % 1000 === 0) ||
			(selectedClient.loyaltyPoints === 1500 && loyaltyPoints % 1500 === 0) ||
			(selectedClient.loyaltyPoints === 2000 && loyaltyPoints % 1500 === 0) ||
			(selectedClient.loyaltyPoints === 2500 && loyaltyPoints % 1500 === 0) ||
			(selectedClient.loyaltyPoints === 3000 && loyaltyPoints % 1500 === 0)
		) {
			callApplyLoyaltyBonus();
		} else if (selectedClient.loyaltyPoints === 500 && loyaltyPoints >= 500) {
			callApplyLoyaltyBonus();
		} else if (selectedClient.loyaltyPoints === 1000 && loyaltyPoints >= 1000) {
			callApplyLoyaltyBonus();
		} else if (selectedClient.loyaltyPoints === 1500 && loyaltyPoints >= 1500) {
			callApplyLoyaltyBonus();
		} else if (selectedClient.loyaltyPoints === 2000 && loyaltyPoints >= 2000) {
			callApplyLoyaltyBonus();
		} else {
			toast.error("No Enough Loyalty Points");
			return;
		}
	};

	const handleApplyFreeService = () => {
		applyFreeService(selectedClient?.id, {
			onSuccess: () => {
				// 1. Grand Canva-style Side Bursts
				const count = 200;
				const defaults = { origin: { y: 0.7 } };

				function fire(
					particleRatio: number,
					opts: confetti.Options | undefined,
				) {
					confetti({
						...defaults,
						...opts,
						particleCount: Math.floor(count * particleRatio),
					});
				}

				fire(0.25, { spread: 26, startVelocity: 55 });
				fire(0.2, { spread: 60 });
				fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });

				// 2. High-Impact Toast Notification
				toast.success("Just For You ! 🏆✨", {
					description: `Congrats! ${user?.name}, your next service est 100% free !`,
					duration: 8000, // Longer for a big win
					style: {
						border: "2px solid #10B981", // Green for "Free/Success"
						padding: "20px",
						fontWeight: "bold",
						fontSize: "16px",
					},
					icon: "🎁",
				});

				// 3. Database Notification (Persistent History)
				createNotification({
					userId: user?.id ?? "",
					type: "loyalty_reward",
					title: `Free Service Unlocked ! 🎖️`,
					message: `Congratulations! Your loyalty paid off. Your next salon visit is completely free. Enjoy your pampering session on us!`,
				});
			},
		});
	};

	const canClaimGiftCard = loyaltyPoints >= selectedClient.loyaltyPoints;
	const canClaimFreeService = nextFreeService === 0;

	// Animation variant for claimable cards
	const claimableAnimation = {
		animate: {
			scale: [1, 1.02, 1],
			boxShadow: [
				"0px 0px 0px rgba(139, 92, 246, 0)",
				"0px 0px 20px rgba(139, 92, 246, 0.4)",
				"0px 0px 0px rgba(139, 92, 246, 0)",
			],
			transition: { duration: 2, repeat: Infinity },
		},
	};

	// Copy referral code
	const handleCopyReferralCode = () => {
		navigator.clipboard.writeText(
			"https://beauty-nails-salon.vercel.app/auth/signup?ref=" +
				referralCode.toLocaleLowerCase(),
		);
		toast.success("Referral link copied!");
	};

	// Get notification icon
	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "appointment_reminder":
			case "appointment_confirmed":
			case "appointment_cancelled":
				return <CalendarIcon className="w-5 h-5 text-purple-500" />;
			case "marketing":
				return <PartyPopper className="w-5 h-5 text-pink-500" />;
			case "loyalty_reward":
				return <Gift className="w-5 h-5 text-amber-500" />;
			case "birthday":
				return <Crown className="w-5 h-5 text-pink-500" />;
			default:
				return <Bell className="w-5 h-5 text-gray-500" />;
		}
	};

	// Get status badge
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "confirmed":
				return (
					<Badge className="bg-green-100 text-green-700 hover:bg-green-100">
						<CheckCircle className="w-3 h-3 mr-1" />
						Confirmed
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
						<Clock className="w-3 h-3 mr-1" />
						Pending
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
						<CheckCircle className="w-3 h-3 mr-1" />
						Completed
					</Badge>
				);
			case "cancelled":
				return (
					<Badge className="bg-red-100 text-red-700 hover:bg-red-100">
						<XCircle className="w-3 h-3 mr-1" />
						Cancelled
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	// Handle update status
	const handleUpdateStatus = (appointmentId: string, newStatus: string) => {
		updateStatus(
			{
				id: appointmentId,
				statusData: { status: newStatus as any },
			},
			{
				onSuccess: () => {
					toast.success("Status updated");
				},
			},
		);
	};

	const prepaid = Number(selectedClient?.prepaymentBalance || 0);
	const appointmentCost = Number(selectedAppointment?.price || 0);

	const canUsePrepaid = prepaid >= appointmentCost;

	const handleReschedule = (
		appointmentId: string,
		time: string,
		date: Date,
		isPrePaidUsed: boolean,
	) => {
		rescheduleAppointment(
			{
				id: appointmentId,
				data: {
					newTime: time,
					newDate: date,
					newStaffId: user?.workerProfile?.id,
					isPrePaidUsed, // ✅ important
				},
			},
			{
				onSuccess: () => {
					toast.success("Appointment rescheduled");
				},
			},
		);
	};

	const handleRefuseAndConvertToPrepaid = (appointment: any) => {
		const amount = Number(appointment.price || 0);
		if (!selectedAppointment || selectedAppointment.status !== "cancelled")
			return;

		cancelAppointment(
			{
				id: selectedAppointment.id,
				reason:
					"<Reschedule Appointment> refused by the client, the amount paid for this service will be credited to their prepaid balance.",
			},
			{
				onSuccess: () => {
					toast.success(
						`The Amount (${amount} CDF) will be added to prepaid balance`,
					);
					setSelectedAppointment(null);
				},
			},
		);
	};

	// Loading state
	if (isAuthLoading || isAppointmentsLoading || isLoyaltyLoading) {
		return <LoaderBN />;
	}

	// Redirect if not authenticated
	if (!user || user.role !== "client") {
		router.push("/");
	}

	return (
		<div className="min-h-screen py-8 bg-linear-to-br from-pink-50 via-purple-50 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Welcome Section */}
				<div className="mb-10">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
						<div>
							<h1 className="text-3xl sm:text-4xl font-medium bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
								Hello, {user?.name} 👋
							</h1>

							<p className="text-gray-900 dark:text-gray-300 text-base sm:text-lg">
								Welcome to your beauty space
							</p>
						</div>

						<div className="flex items-center gap-3">
							{/* Notifications */}
							<Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
								<SheetTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="relative dark:border-gray-700 dark:text-gray-200"
									>
										<Bell className="w-5 h-5" />

										{unreadCount > 0 && (
											<span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-base rounded-full flex items-center justify-center">
												{unreadCount}
											</span>
										)}
									</Button>
								</SheetTrigger>

								<SheetContent className="p-3 border-r-0 border-pink-100 dark:border-pink-900 shadow-xl rounded-l-2xl bg-white dark:bg-gray-950">
									<div className="mb-5">
										<h2 className="text-2xl mb-1 dark:text-gray-100">
											Notifications
										</h2>

										<div className="flex items-center justify-between">
											<p className="text-lg text-gray-900 dark:text-gray-300">
												{unreadCount} unread
											</p>

											{unreadCount > 0 && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => markAllAsRead()}
													className="dark:text-gray-200 dark:hover:bg-gray-800"
												>
													Mark all as read
												</Button>
											)}
										</div>
									</div>

									<ScrollArea className="h-[calc(100vh-200px)]">
										<div className="space-y-3">
											{notificationList.length === 0 ? (
												<div className="text-center py-12 text-gray-500">
													<Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
													<p>No notifications</p>
												</div>
											) : (
												notificationList.map((notification) => (
													<div
														key={notification.id}
														onClick={() => markAsRead(notification.id)}
														className={`p-4 rounded-xl border cursor-pointer transition-colors
                  ${
										notification.isRead
											? "bg-white dark:bg-gray-950 border-pink-100 dark:border-pink-900"
											: "bg-pink-100 dark:bg-pink-950 border-pink-200 dark:border-pink-800"
									}`}
													>
														<div className="flex gap-3">
															{getNotificationIcon(notification.type)}

															<div className="flex-1">
																<h3 className="font-semibold text-lg mb-1">
																	{notification.title}
																</h3>

																<p className="text-lg text-gray-900 dark:text-gray-100 mb-1">
																	{notification.message}
																</p>

																<p className="text-base text-gray-500">
																	{formatDate(notification.createdAt)}
																</p>
															</div>
														</div>
													</div>
												))
											)}
										</div>
									</ScrollArea>
								</SheetContent>
							</Sheet>

							<Link href="/appointments">
								<Button className="bg-linear-to-r from-pink-500 to-purple-500">
									Book an Appointment
								</Button>
							</Link>
						</div>
					</div>

					{/* Main Stats */}

					<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
						{/* Loyalty */}
						{/* 1. Loyalty Card */}
						<Popover>
							<PopoverTrigger asChild>
								<motion.div {...(canClaimGiftCard ? claimableAnimation : {})}>
									<Card
										className={`p-4 sm:p-5 h-full cursor-pointer bg-linear-to-br from-pink-500 to-purple-500 text-white border-0 shadow-xl flex flex-col justify-between ${canClaimGiftCard ? "ring-2 ring-white ring-offset-2 ring-offset-purple-500" : ""}`}
									>
										<div className="flex items-center justify-between">
											<div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
												<Gift className="w-5 h-5" />
											</div>
											{loyaltyTier === "VIP" && (
												<Crown className="w-5 h-5 opacity-80" />
											)}
										</div>
										<div>
											<p className="text-lg opacity-90">Loyalty Points</p>
											<p className="text-3xl sm:text-4xl font-bold mt-1">
												{loyaltyPoints}
											</p>
											<div className="flex flex-row justify-between">
												<Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mt-2 text-base">
													{loyaltyTier}
												</Badge>
												<p>
													to{" "}
													<Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mt-2 text-2xl">
														{selectedClient.loyaltyPoints}
													</Badge>
												</p>
											</div>
										</div>
									</Card>
								</motion.div>
							</PopoverTrigger>
							<PopoverContent className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
								<p className="text-base mb-3">
									Accumulate points with each service to unlock gift cards.
								</p>
								{canClaimGiftCard ? (
									<Button
										className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
										onClick={handleApplyLoyaltyBonus}
									>
										Claim free gift card 🎁
									</Button>
								) : (
									<p className="text-xs text-muted-foreground italic">
										Need {selectedClient.loyaltyPoints} points to claim.
									</p>
								)}
							</PopoverContent>
						</Popover>

						{/* 2. Appointments Card */}
						<Popover>
							<PopoverTrigger asChild>
								<Card className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between">
									<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit">
										<CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<p className="text-lg text-gray-900 dark:text-gray-300">
											Appointments
										</p>
										<p className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
											{completedAppointments}
										</p>
										<p className="text-base text-gray-500 dark:text-gray-400">
											{upcomingAppointments.length} upcoming
										</p>
									</div>
								</Card>
							</PopoverTrigger>
							<PopoverContent className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
								<p className="text-sm">
									Visit history. The more you visit, the more you earn in perks!
								</p>
							</PopoverContent>
						</Popover>

						{/* 3. Referrals Card */}
						<Popover>
							<PopoverTrigger asChild>
								<Card className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between">
									<div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg w-fit">
										<Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
									</div>
									<div>
										<p className="text-lg text-gray-900 dark:text-gray-300">
											Referrals
										</p>
										<p className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
											{referrals?.length}
										</p>
										<p className="text-base text-gray-500 dark:text-gray-400">
											{nextFreeReferral > 0
												? `${nextFreeReferral} for free service`
												: `claim your 10% discount`}
										</p>
									</div>
								</Card>
							</PopoverTrigger>
							<PopoverContent className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
								<p className="text-sm">
									Invite your friends! For every 5 completed referrals, enjoy a
									10% discount this month.
								</p>
							</PopoverContent>
						</Popover>

						{/* 4. Free Service Card */}
						<Popover>
							<PopoverTrigger asChild>
								<motion.div
									{...(canClaimFreeService ? claimableAnimation : {})}
								>
									<Card
										className={`p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between ${canClaimFreeService ? "border-green-500 border-2 shadow-green-100" : ""}`}
									>
										<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit">
											<Award className="w-5 h-5 text-green-600 dark:text-green-400" />
										</div>
										<div>
											<p className="text-lg text-gray-900 dark:text-gray-300">
												Free service in
											</p>
											<p className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
												{nextFreeService}
											</p>
											<p className="text-base text-gray-500 dark:text-gray-400">
												appointments
											</p>
										</div>
									</Card>
								</motion.div>
							</PopoverTrigger>
							<PopoverContent className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
								<p className="text-base mb-3">
									Your loyalty rewarded! A free service every 5 appointments.
								</p>
								{canClaimFreeService ? (
									<Button
										className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
										onClick={handleApplyFreeService}
									>
										Claim my free service 🏆
									</Button>
								) : (
									<p className="text-xs text-muted-foreground italic">
										Keep it up!
									</p>
								)}
							</PopoverContent>
						</Popover>
					</div>

					{/* Secondary Stats */}

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
							<p className="text-xl font-black text-gray-900 dark:text-gray-100">
								{appointments ? appointments.length : 0}
							</p>
							<p className="text-base text-gray-500 uppercase tracking-tight">
								All Appointments
							</p>
						</div>

						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
							<p className="text-xl font-black text-gray-900 dark:text-gray-100 truncate">
								{Number(selectedClient?.totalSpent || 0)
									.toFixed(2)
									.toLocaleString()}{" "}
								CDF
							</p>
							<p className="text-base text-gray-500 uppercase tracking-tight">
								Spent
							</p>
						</div>

						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<Gift className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
							<p className="text-xl font-black text-gray-900 dark:text-gray-100">
								{selectedClient?.giftCardBalance}
							</p>
							<p className="text-base text-gray-500 uppercase tracking-tight">
								Gift Card
							</p>
						</div>

						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
							<p className="text-xl font-black text-gray-900 dark:text-gray-100">
								{Number(selectedClient?.prepaymentBalance)
									.toFixed(2)
									.toLocaleString()}{" "}
								CDF
							</p>
							<p className="text-base text-gray-500 uppercase tracking-tight">
								Prepaid
							</p>
						</div>
					</div>
				</div>

				{/* Main Content Tabs */}
				<p className=" dark:text-pink-400 text-xs sm:text-xs">
					{"glisser  <--- | --->"}
				</p>
				<Tabs defaultValue="appointments" className="space-y-6">
					<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
						<TabsTrigger value="appointments">
							<CalendarIcon className="w-4 h-4 mr-2" />
							Appointments
						</TabsTrigger>
						<TabsTrigger value="package-appointments">
							<CalendarIcon className="w-4 h-4 mr-2" />
							Package Appointments
						</TabsTrigger>
						<TabsTrigger value="referrals">
							<Users className="w-4 h-4 mr-2" />
							Referral
						</TabsTrigger>
						<TabsTrigger value="loyalty">
							<Gift className="w-4 h-4 mr-2" />
							Loyalty
						</TabsTrigger>
						<TabsTrigger value="profile">
							<User className="w-4 h-4 mr-2" />
							Profile
						</TabsTrigger>
						<TabsTrigger
							value="tasks"
							className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm"
						>
							Mentions
						</TabsTrigger>
					</TabsList>

					{/* Appointments Tab */}
					<TabsContent value="appointments" className="space-y-6">
						{/* Upcoming Appointments */}
						<Card className="p-6">
							{ongoingAppointments.length > 0 && (
								<>
									<h2 className="text-2xl   mb-6 flex items-center">
										<Clock className="w-6 h-6 mr-2 text-pink-500" />
										Ongoing Appointments
									</h2>
									<div className="space-y-4">
										{ongoingAppointments.map((appointment) => {
											return (
												<div
													key={appointment.id}
													className={cn(
														"p-6 hover:shadow-lg border shadow-xl rounded-2xl bg-white dark:bg-gray-950 transition-all duration-300",
														appointment.status === "in_progress"
															? "border-transparent relative overflow-hidden animate-border-glow"
															: "border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400",
													)}
												>
													{/* ✨ Animated border */}
													{appointment.status === "in_progress" && (
														<div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent bg-[conic-linear(at_top,#ec4899,#a855f7,#ec4899)] animate-spin-slow opacity-40" />
													)}

													<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-3">
																<h3 className="text-xl ">
																	{appointment.package
																		? ""
																		: appointment.service?.name || "Service"}
																</h3>
																{appointment.package && (
																	<Badge className="bg-purple-500 text-white">
																		<Sparkles className="w-3 h-3 mr-1" />
																		Package: {appointment.package.name}
																	</Badge>
																)}
																{getStatusBadge(appointment.status)}
															</div>

															<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-lg text-gray-900 dark:text-gray-100">
																<div className="flex items-center gap-2">
																	<CalendarIcon className="w-4 h-4 text-pink-500" />
																	<span>{formatDate(appointment.date)}</span>
																</div>
																<div className="flex items-center gap-2">
																	<Clock className="w-4 h-4 text-purple-500" />
																	<span>{appointment.time}</span>
																</div>
																<div className="flex items-center gap-2">
																	<Users className="w-4 h-4 text-amber-500" />
																	<span>
																		{appointment.worker?.user?.name ||
																			"Unassigned"}
																	</span>
																</div>
																<div className="flex items-center gap-2">
																	<MapPin className="w-4 h-4 text-green-500" />
																	<span>
																		{appointment.location === "salon"
																			? "Salon"
																			: "Home"}
																	</span>
																</div>
															</div>

															{appointment.notes && (
																<div className="mt-3 p-3 bg-purple-50 rounded-lg">
																	<p className="text-lg text-gray-700">
																		<MessageSquare className="w-4 h-4 inline mr-2" />
																		{appointment.notes}
																	</p>
																</div>
															)}
														</div>

														<div className="flex flex-col gap-2">
															<div className="text-right mb-2">
																<p className="text-2xl text-pink-600">
																	{appointment.price?.toLocaleString()} CDF
																</p>
															</div>
															<div className="p-4 rounded-xl bg-linear-to-r from-pink-500 to-purple-600 text-white text-center font-medium shadow-lg animate-pulse">
																We promise satisfaction and professionalism.
																<br />
																<span className="font-bold">
																	ENJOY YOUR APPOINTMENT!!
																</span>
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</>
							)}
							<h2 className="text-2xl   mb-6 flex items-center">
								<Clock className="w-6 h-6 mr-2 text-pink-500" />
								Upcoming Appointments
							</h2>

							{upcomingAppointments.length === 0 ? (
								<div className="text-center py-12">
									<CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
									<p className="text-gray-900 dark:text-gray-100 mb-4">
										No appointments scheduled
									</p>
									<Link href="/appointments">
										<Button className="bg-linear-to-r from-pink-500 to-purple-500">
											Book an Appointment
										</Button>
									</Link>
								</div>
							) : (
								<div className="space-y-4">
									{upcomingAppointments.map((appointment) => {
										const missed = isAppointmentMissed(
											appointment.date,
											appointment.time,
										);

										return (
											<div
												key={appointment.id}
												className={cn(
													"p-6 hover:shadow-lg border shadow-xl rounded-2xl bg-white dark:bg-gray-950 transition-all duration-300",
													appointment.status === "in_progress"
														? "border-transparent relative overflow-hidden animate-border-glow"
														: "border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400",
												)}
											>
												{/* ✨ Animated border */}
												{appointment.status === "in_progress" && (
													<div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent bg-[conic-linear(at_top,#ec4899,#a855f7,#ec4899)] animate-spin-slow opacity-40" />
												)}

												<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
													<div className="flex-1">
														<div className="flex items-center gap-3 mb-3">
															<h3 className="text-xl ">
																{appointment.package
																	? "All in one package"
																	: appointment.service?.name || "Service"}
															</h3>
															{appointment.package && (
																<Badge className="bg-purple-500 text-white">
																	<Sparkles className="w-3 h-3 mr-1" />
																	Package: {appointment.package.name}
																</Badge>
															)}
															{getStatusBadge(appointment.status)}
														</div>

														<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-lg text-gray-900 dark:text-gray-100">
															<div className="flex items-center gap-2">
																<CalendarIcon className="w-4 h-4 text-pink-500" />
																<span>{formatDate(appointment.date)}</span>
															</div>
															<div className="flex items-center gap-2">
																<Clock className="w-4 h-4 text-purple-500" />
																<span>{appointment.time}</span>
															</div>
															<div className="flex items-center gap-2">
																<Users className="w-4 h-4 text-amber-500" />
																<span>
																	{appointment.worker?.user?.name ||
																		"Unassigned"}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<MapPin className="w-4 h-4 text-green-500" />
																<span>
																	{appointment.location === "salon"
																		? "Salon"
																		: "Home"}
																</span>
															</div>
														</div>

														{appointment.notes && (
															<div className="mt-3 p-3 bg-purple-50 rounded-lg">
																<p className="text-lg text-gray-700">
																	<MessageSquare className="w-4 h-4 inline mr-2" />
																	{appointment.notes}
																</p>
															</div>
														)}
													</div>

													<div className="flex flex-col gap-2">
														<div className="text-right mb-2">
															<p className="text-2xl text-pink-600">
																{appointment.price?.toLocaleString()} CDF
															</p>
														</div>
														{/* 🔥 CONDITIONAL DISPLAY */}
														{appointment.status === "in_progress" ? (
															<div className="p-4 rounded-xl bg-linear-to-r from-pink-500 to-purple-600 text-white text-center font-medium shadow-lg animate-pulse">
																We promise satisfaction and professionalism.
																<br />
																<span className="font-bold">
																	ENJOY YOUR APPOINTMENT!!
																</span>
															</div>
														) : (
															<>
																<AppointmentCountdown
																	date={appointment.date}
																	time={appointment.time}
																	appointment={appointment}
																	onMissedAutoCancel={handleMissedAutoCancel}
																/>
																{missed &&
																	appointment.status === "cancelled" && (
																		<Popover>
																			<PopoverTrigger asChild>
																				<Button
																					size="sm"
																					variant="outline"
																					className="text-amber-600 border-amber-400 hover:bg-amber-50"
																				>
																					Missed Appointment
																				</Button>
																			</PopoverTrigger>

																			<PopoverContent className="w-85 rounded-2xl p-4 space-y-4">
																				{/* 🧠 Info */}
																				<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
																					<p className="font-semibold text-amber-600">
																						⚠️ Missed Appointment
																					</p>

																					<p>
																						You can reschedule this appointment
																						or decline.
																					</p>
																				</div>

																				{/* 💰 Prepaid Status */}
																				<div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border text-sm">
																					{canUsePrepaid ? (
																						<p className="text-green-600 font-medium">
																							✅ The prepaid balance will
																							automatically cover this service
																						</p>
																					) : (
																						<p className="text-red-500 font-medium">
																							❌ Insufficient prepaid balance
																							(payment required)
																						</p>
																					)}
																				</div>

																				{/* 📅 Date */}
																				<Popover>
																					<PopoverTrigger asChild>
																						<Button
																							variant="outline"
																							className={cn(
																								"w-full justify-start text-left font-normal",
																								!selectedDate &&
																									"text-muted-foreground",
																							)}
																						>
																							<CalendarIcon className="mr-2 h-4 w-4" />
																							{selectedDate
																								? format(selectedDate, "PPP", {
																										locale: enUS,
																									})
																								: "Choose date"}
																						</Button>
																					</PopoverTrigger>

																					<PopoverContent className="w-auto p-0">
																						<Calendar
																							mode="single"
																							selected={selectedDate}
																							onSelect={setSelectedDate}
																							disabled={(date) =>
																								date < new Date()
																							}
																						/>
																					</PopoverContent>
																				</Popover>

																				{/* ⏰ Time */}
																				<div>
																					{slots?.slots.length != 0 ? (
																						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
																							Available Times{" "}
																							<span className="text-md font-bold text-pink-600">
																								{selectedWorkerName}
																							</span>{" "}
																							will be available on{" "}
																							<span className="text-md font-bold text-pink-600">
																								{selectedDate
																									? format(
																											selectedDate,
																											"PPP",
																											{
																												locale: enUS,
																											},
																										)
																									: ""}
																							</span>
																						</h3>
																					) : (
																						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
																							Unfortunately{" "}
																							<span className="text-md font-bold text-pink-600">
																								{selectedWorkerName}
																							</span>{" "}
																							is not working on{" "}
																							<span className="text-md font-bold text-pink-600">
																								the{" "}
																								{selectedDate
																									? weekDay[
																											selectedDate.getDay()
																										]
																									: ""}
																							</span>
																						</h3>
																					)}
																					<div
																						className={`grid ${slots?.slots.length != 0 ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : ""} gap-2`}
																					>
																						{slots?.slots.length === 0 ? (
																							<p className="p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700">
																								Unfortunately, no time is
																								available for this date. Choose
																								another specialist or another
																								date.
																							</p>
																						) : (
																							slots?.slots.map((time) => (
																								<button
																									key={time}
																									type="button"
																									onClick={() =>
																										setSelectedTime(time)
																									}
																									className={`p-2 rounded-lg border ${
																										selectedTime === time
																											? "bg-pink-500 text-white border-pink-500"
																											: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
																									} ${
																										selectedDate &&
																										selectedDate < new Date() &&
																										Number(time.split(":")[0]) <
																											new Date().getHours()
																											? "cursor-not-allowed opacity-50"
																											: "cursor-pointer"
																									}`}
																									disabled={
																										selectedDate &&
																										selectedDate < new Date() &&
																										Number(time.split(":")[0]) <
																											new Date().getHours()
																											? true
																											: false
																									}
																								>
																									{time}
																								</button>
																							))
																						)}
																					</div>
																				</div>

																				{/* 📌 Explanation */}
																				<div className="text-xs text-gray-500 space-y-1">
																					<p>
																						• Reschedule → uses the prepaid
																						balance if available
																					</p>
																					<p>
																						• Decline → amount will be added to
																						your prepaid balance
																					</p>
																				</div>

																				{/* 🔘 Actions */}
																				<div className="flex gap-2">
																					<Button
																						disabled={
																							!selectedDate || !selectedTime
																						}
																						onClick={() =>
																							handleReschedule(
																								appointment.id,
																								selectedTime,
																								selectedDate!,
																								canUsePrepaid,
																							)
																						}
																						className={cn(
																							canUsePrepaid
																								? "bg-green-600 hover:bg-green-700"
																								: "bg-gray-400 cursor-not-allowed",
																						)}
																					>
																						Reschedule
																					</Button>
																				</div>
																			</PopoverContent>
																		</Popover>
																	)}
															</>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}

							<h2 className="text-2xl font-medium mt-6 mb-6 flex items-center">
								<AlertCircle className="w-6 h-6 mr-2 text-pink-500" />
								Missed Appointment
							</h2>

							<div className="space-y-4">
								{missedAppointments.map((appointment) => {
									const missed = isAppointmentMissed(
										appointment.date,
										appointment.time,
									);

									return (
										<div
											key={appointment.id}
											className="p-6 hover:shadow-lg border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-3">
														<h3 className="text-xl ">
															{appointment.service?.name || "Service"}
														</h3>
														{getStatusBadge(appointment.status)}
													</div>

													<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-lg text-gray-900 dark:text-gray-100">
														<div className="flex items-center gap-2">
															<CalendarIcon className="w-4 h-4 text-pink-500" />
															<span>{formatDate(appointment.date)}</span>
														</div>
														<div className="flex items-center gap-2">
															<Clock className="w-4 h-4 text-purple-500" />
															<span>{appointment.time}</span>
														</div>
														<div className="flex items-center gap-2">
															<Users className="w-4 h-4 text-amber-500" />
															<span>
																{appointment.worker?.user?.name ||
																	"Non assigné"}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<MapPin className="w-4 h-4 text-green-500" />
															<span>
																{appointment.location === "salon"
																	? "Salon"
																	: "Domicile"}
															</span>
														</div>
													</div>

													{appointment.notes && (
														<div className="mt-3 p-3 bg-purple-50 rounded-lg">
															<p className="text-lg text-gray-700">
																<MessageSquare className="w-4 h-4 inline mr-2" />
																{appointment.notes}
															</p>
														</div>
													)}
												</div>

												<div className="flex flex-col gap-2">
													<div className="text-right mb-2">
														<p className="text-2xl font-medium  text-pink-600">
															{appointment.price?.toLocaleString()} CDF
														</p>
													</div>
													<AppointmentCountdown
														date={appointment.date}
														time={appointment.time}
														appointment={appointment}
														onMissedAutoCancel={handleMissedAutoCancel}
													/>
													{missed && appointment.status === "cancelled" && (
														<Popover>
															<PopoverTrigger asChild>
																<Button
																	onClick={() => {
																		setSelectedWorker(appointment.worker?.id);
																		setSelectedWorkerName(
																			appointment.worker?.user?.name,
																		);
																		setSelectedAppointment(appointment);
																	}}
																	size="sm"
																	variant="outline"
																	className="text-amber-600 border-amber-400 hover:bg-amber-50"
																>
																	Missed Appointment
																</Button>
															</PopoverTrigger>

															<PopoverContent className="w-95 rounded-2xl p-4 space-y-4">
																{/* 🧠 Info */}
																<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
																	<p className="font-semibold text-amber-600">
																		⚠️ Missed Appointment
																	</p>

																	<p>
																		You can reschedule this appointment or
																		decline.
																	</p>
																</div>

																{/* 💰 Prepaid Status */}
																<div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border text-sm">
																	{canUsePrepaid ? (
																		<p className="text-green-600 font-medium">
																			✅ The prepaid balance will automatically
																			cover this service
																		</p>
																	) : (
																		<p className="text-red-500 font-medium">
																			❌ Insufficient prepaid balance (payment
																			required)
																		</p>
																	)}
																</div>

																{/* 📅 Date */}
																<Popover>
																	<PopoverTrigger asChild>
																		<Button
																			variant="outline"
																			className={cn(
																				"w-full justify-start text-left font-normal",
																				!selectedDate &&
																					"text-muted-foreground",
																			)}
																		>
																			<CalendarIcon className="mr-2 h-4 w-4" />
																			{selectedDate
																				? format(selectedDate, "PPP", {
																						locale: enUS,
																					})
																				: "Choose date"}
																		</Button>
																	</PopoverTrigger>

																	<PopoverContent className="w-auto p-0">
																		<Calendar
																			mode="single"
																			selected={selectedDate}
																			onSelect={setSelectedDate}
																			disabled={(date) => date < new Date()}
																		/>
																	</PopoverContent>
																</Popover>

																{/* ⏰ Time */}
																<div>
																	{slots?.slots.length != 0 ? (
																		<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
																			Available Times{" "}
																			<span className="text-md font-bold text-pink-600">
																				{selectedWorkerName}
																			</span>{" "}
																			will be available on{" "}
																			<span className="text-md font-bold text-pink-600">
																				{selectedDate
																					? format(selectedDate, "PPP", {
																							locale: enUS,
																						})
																					: ""}
																			</span>
																		</h3>
																	) : (
																		<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
																			Unfortunately{" "}
																			<span className="text-md font-bold text-pink-600">
																				{selectedWorkerName}
																			</span>{" "}
																			is not working on{" "}
																			<span className="text-md font-bold text-pink-600">
																				the{" "}
																				{selectedDate
																					? weekDay[selectedDate.getDay()]
																					: ""}
																			</span>
																		</h3>
																	)}
																	<div
																		className={`grid ${slots?.slots.length != 0 ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : ""} gap-2`}
																	>
																		{slots?.slots.length === 0 ? (
																			<p className="p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700">
																				Unfortunately, no time is available for
																				this date. Choose another specialist or
																				another date.
																			</p>
																		) : (
																			slots?.slots.map((time) => (
																				<button
																					key={time}
																					type="button"
																					onClick={() => setSelectedTime(time)}
																					className={`p-2 rounded-lg border ${
																						selectedTime === time
																							? "bg-pink-500 text-white border-pink-500"
																							: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
																					} ${
																						selectedDate &&
																						selectedDate < new Date() &&
																						Number(time.split(":")[0]) <
																							new Date().getHours()
																							? "cursor-not-allowed opacity-50"
																							: "cursor-pointer"
																					}`}
																					disabled={
																						selectedDate &&
																						selectedDate < new Date() &&
																						Number(time.split(":")[0]) <
																							new Date().getHours()
																							? true
																							: false
																					}
																				>
																					{time}
																				</button>
																			))
																		)}
																	</div>
																</div>
																{/* 📌 Explanation */}
																<div className="text-xs text-gray-500 space-y-1">
																	<p>
																		• Reschedule → uses the prepaid balance if
																		available
																	</p>
																	<p>
																		• Decline → amount will be added to your
																		prepaid balance
																	</p>
																</div>

																{/* 🔘 Actions */}
																<div className="flex gap-2">
																	<Button
																		variant="outline"
																		className="text-red-600"
																		onClick={() =>
																			handleRefuseAndConvertToPrepaid(
																				appointment,
																			)
																		}
																	>
																		Decline
																	</Button>

																	<Button
																		disabled={
																			!selectedDate ||
																			!selectedTime ||
																			!canUsePrepaid
																		}
																		onClick={() =>
																			handleReschedule(
																				appointment.id,
																				selectedTime,
																				selectedDate!,
																				canUsePrepaid,
																			)
																		}
																		className={cn(
																			canUsePrepaid
																				? "bg-green-600 hover:bg-green-700"
																				: "bg-gray-400 cursor-not-allowed",
																		)}
																	>
																		Reschedule
																	</Button>
																</div>
															</PopoverContent>
														</Popover>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</Card>

						{/* Appointment History */}
						<Card className="p-6">
							<h2 className="text-2xl font-medium   mb-6 flex items-center">
								<Package className="w-6 h-6 mr-2 text-purple-500" />
								Appointment History
							</h2>

							{appointmentHistory.length === 0 ? (
								<div className="text-center py-12 text-gray-500">
									<Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
									<p>No history</p>
								</div>
							) : (
								<div className="space-y-3">
									{appointmentHistory.map((appointment) => (
										<div
											key={appointment.id}
											className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-2">
													<h3 className="font-semibold">
														{appointment.service?.name}
													</h3>
													{getStatusBadge(appointment.status)}
												</div>
												<div className="flex items-center gap-4 text-lg text-gray-900 dark:text-gray-100">
													<span>{formatDate(appointment.date)}</span>
													<span>•</span>
													<span>{appointment.worker?.user?.name}</span>
												</div>
											</div>

											<div className="flex items-center gap-4">
												<p className=" text-gray-900 dark:text-gray-200">
													{appointment.price?.toLocaleString()} CDF
												</p>
												{appointment.status === "completed" &&
													!appointment.review && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedAppointment(appointment);
																setReviewDialogOpen(true);
															}}
														>
															<Star className="w-4 h-4 mr-2" />
															Rate
														</Button>
													)}
											</div>
										</div>
									))}
								</div>
							)}
						</Card>
					</TabsContent>

					{/* Packages Tab */}
					<TabsContent value="package-appointments" className="space-y-6">
						<div className="space-y-6">
							{/* Section 2: My Booked Package Appointments */}
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										My Package Bookings
									</h2>
									<Badge
										variant="outline"
										className="text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-900"
									>
										{packageAppointments.length} package appointment
										{packageAppointments.length > 1 ? "s" : ""}
									</Badge>
								</div>

								{isPackagesLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-8 w-8 animate-spin text-pink-500" />
									</div>
								) : packageAppointments.length === 0 ? (
									<Card className="p-8 text-center border-dashed border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
										<Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
											No package booked
										</h3>
										<p className="text-gray-500 dark:text-gray-400 mt-2">
											You haven't booked any package. Discover our exclusive
											offers to transform your beauty.
										</p>
									</Card>
								) : (
									<div className="grid gap-4">
										{packageAppointments.map((apt) => (
											<Card
												key={apt.id}
												className="group relative overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-pink-300 dark:hover:border-pink-900 transition-all hover:shadow-lg"
											>
												{/* Accent Line */}
												<div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-pink-500 to-purple-500" />

												<div className="p-5 sm:p-6">
													{/* Header: Package Name & Status */}
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
														<div className="flex items-center gap-3">
															<div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
																<Package className="w-5 h-5 text-pink-600 dark:text-pink-400" />
															</div>
															<div>
																<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
																	{apt.package?.name || "Beauty Package"}
																</h3>
																<p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
																	<CalendarIcon className="w-3 h-3" />
																	{format(new Date(apt.date), "PPP", {
																		locale: enUS,
																	})}{" "}
																	at {apt.time}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-3 sm:flex-col sm:items-end">
															<Badge
																className={
																	apt.status === "confirmed"
																		? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
																		: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
																}
															>
																{apt.status === "confirmed"
																	? "Confirmed"
																	: "Pending"}
															</Badge>
															<span className="text-lg font-bold text-gray-900 dark:text-gray-100">
																{Number(apt.price)?.toLocaleString() || 0} Fc
															</span>
														</div>
													</div>

													{/* Body: Services & Add-ons Breakdown */}
													<div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
														<div>
															<h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
																Included Services (
																{apt.package?.services?.length || 0})
															</h4>
															<div className="flex flex-wrap gap-2">
																{apt.package?.services?.map((service: any) => (
																	<span
																		key={service.id}
																		className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm"
																	>
																		{[
																			{
																				onglerie: (
																					<Scissors className="w-5 h-5" />
																				),
																				cils: <Eye className="w-5 h-5" />,
																				tresses: (
																					<Scissors className="w-5 h-5" />
																				),
																				maquillage: (
																					<Sparkles className="w-5 h-5" />
																				),
																			},
																		][service.category] || (
																			<Scissors className="w-3 h-3 mr-1" />
																		)}
																		{service.name}
																	</span>
																))}
															</div>
														</div>

														{/* {apt.addOns && apt.addOns.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-2">
                                    Additional Options
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {apt.addOns.map((addon, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            {typeof addon === 'object' ? addon.name : addon}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )} */}
													</div>

													{/* Footer: Action */}
													<div className="mt-4 flex justify-end">
														<Button
															variant="ghost"
															size="sm"
															className="text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
															onClick={() => {
																/* Open details modal */
															}}
														>
															View Details
															<ChevronRight className="w-4 h-4 ml-1" />
														</Button>
													</div>
												</div>
											</Card>
										))}
									</div>
								)}
							</div>
							{/* Section 1: Browse Available Packages */}
							<div>
								<h2 className="text-2xl font-bold mb-4">
									Our Available Packages
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{availablePackages?.map((pkg) => (
										<PackageCard key={pkg.id} pkg={pkg} />
									))}
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Referrals Tab */}
					<TabsContent value="referrals" className="space-y-6">
						<Card className="p-6">
							<h2 className="text-2xl font-medium mb-6 flex items-center">
								<Share2 className="w-6 h-6 mr-2 text-pink-500" />
								Referral Program
							</h2>

							{/* Referral Code */}
							<div className="mb-8 p-6 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
								<h3 className="text-lg font-semibold mb-4">
									Your Referral Code
								</h3>
								<div className="flex items-center gap-3 mb-4 flex-col">
									<div className="flex-1 p-4 bg-background rounded-lg border-2 border-dashed border-pink-300">
										<p className="text-lg lg:text-3xl text-center text-pink-600 tracking-wider">
											{referralCode
												? "https://beauty-nails-salon.vercel.app/auth/signup?ref=" +
													referralCode.toLocaleLowerCase()
												: "Loading..."}
										</p>
									</div>
									<Button
										size="lg"
										onClick={handleCopyReferralCode}
										className="bg-linear-to-r from-pink-500 to-purple-500"
									>
										<Share2 className="w-5 h-5 mr-2" />
										Copy
									</Button>
								</div>

								<div className="grid grid-cols-2 gap-4 text-center">
									<div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
										<p className="text-2xl font-medium text-pink-600">
											{referrals?.length || 0}
										</p>
										<p className="text-lg text-gray-900 dark:text-gray-100">
											Successful Referrals
										</p>
									</div>
									<div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
										<p className="text-2xl font-medium text-purple-600">
											{nextFreeReferral}
										</p>
										<p className="text-lg text-gray-900 dark:text-gray-100">
											Remaining for free service
										</p>
									</div>
								</div>
							</div>

							<Card className="mb-8 p-6 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-semibold">Referral History</h3>

									<p className="text-lg">referred by </p>
									<h3 className="text-pink-500 font-bold text-lg">
										{user?.clientProfile?.referredBy}
									</h3>

									{canClaimBonus && (
										<Button
											onClick={handleClaimRefBonus}
											className="bg-linear-to-r from-amber-500 to-yellow-500 hover:opacity-90"
										>
											🎁 Claim Bonus
										</Button>
									)}
								</div>

								{isLoading ? (
									<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
										<Loader2 className="h-8 w-8 animate-spin" />
									</div>
								) : referralList.length === 0 ? (
									<p className="text-lg text-muted-foreground">
										No referrals yet.
									</p>
								) : (
									<div className="rounded-xl border overflow-hidden">
										<div className="max-h-100 overflow-y-auto">
											<table className="w-full text-lg">
												<thead className="bg-muted sticky top-0 z-10">
													<tr>
														<th className="text-left p-3">Name</th>
														<th className="text-left p-3">Email</th>
														<th className="text-left p-3">Phone</th>
														<th className="text-left p-3">Spending</th>
														<th className="text-left p-3">Status</th>
														<th className="text-left p-3">Reward</th>
													</tr>
												</thead>

												<tbody>
													{referralList.map((ref) => (
														<tr
															key={ref.id}
															className="border-t hover:bg-muted/40 transition"
														>
															<td className="p-3 font-medium">
																{ref.referred.user.name}
															</td>

															<td className="p-3">{ref.referred.user.email}</td>

															<td className="p-3">{ref.referred.user.phone}</td>

															<td className="p-3">
																{ref.referred.totalSpent.toLocaleString()} CDF
															</td>

															<td className="p-3">
																<span
																	className={`px-3 py-1 text-base rounded-full ${
																		ref.status === "completed"
																			? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
																			: ref.status === "pending"
																				? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
																				: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
																	}`}
																>
																	{ref.status}
																</span>
															</td>

															<td className="p-3">
																{ref.rewardGranted ? (
																	<span className="text-green-600 dark:text-green-400 text-base font-medium">
																		✔ Granted
																	</span>
																) : (
																	<span className="text-muted-foreground text-base">
																		—
																	</span>
																)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</Card>
							<Card className="mb-8 p-6 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-semibold">
										Referrals - Bonus ✔ Granted
									</h3>
								</div>

								{isLoading ? (
									<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
										<Loader2 className="h-8 w-8 animate-spin" />
									</div>
								) : referralList.length === 0 ? (
									<>
										<p className="text-lg text-muted-foreground">
											Continue referring.
										</p>
										<p className="text-lg text-muted-foreground">
											Enjoy 10% off on all our services.
										</p>
									</>
								) : (
									<div className="rounded-xl border overflow-hidden">
										<div className="max-h-100 overflow-y-auto">
											<table className="w-full text-lg">
												<thead className="bg-muted sticky top-0 z-10">
													<tr>
														<th className="text-left p-3">Name</th>
														<th className="text-left p-3">Email</th>
														<th className="text-left p-3">Phone</th>
														<th className="text-left p-3">Spending</th>
														<th className="text-left p-3">Status</th>
														<th className="text-left p-3">Reward</th>
													</tr>
												</thead>

												<tbody>
													{referralList
														.filter((r) => r.status === "rewarded")
														.map((ref) => (
															<tr
																key={ref.id}
																className="border-t hover:bg-muted/40 transition"
															>
																<td className="p-3 font-medium">
																	{ref.referred.user.name}
																</td>

																<td className="p-3">
																	{ref.referred.user.email}
																</td>

																<td className="p-3">
																	{ref.referred.user.phone}
																</td>

																<td className="p-3">
																	{ref.referred.totalSpent.toLocaleString()} CDF
																</td>

																<td className="p-3">
																	<span
																		className={`px-3 py-1 text-base rounded-full ${
																			ref.status === "completed"
																				? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
																				: ref.status === "pending"
																					? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
																					: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
																		}`}
																	>
																		{ref.status}
																	</span>
																</td>

																<td className="p-3">
																	{ref.rewardGranted ? (
																		<span className="text-green-600 dark:text-green-400 text-base font-medium">
																			✔ Granted
																		</span>
																	) : (
																		<span className="text-muted-foreground text-base">
																			—
																		</span>
																	)}
																</td>
															</tr>
														))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</Card>

							{/* How it works */}
							<div className="space-y-4">
								<h3 className="text-lg font-semibold">How does it work?</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="p-4 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
										<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
											<span className="text-2xl font-medium text-pink-600">
												1
											</span>
										</div>
										<h4 className="font-semibold mb-2">Share</h4>
										<p className="text-lg text-gray-900 dark:text-gray-100">
											Share your code with friends
										</p>
									</div>
									<div className="p-4 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
										<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
											<span className="text-2xl font-medium text-purple-600">
												2
											</span>
										</div>
										<h4 className="font-semibold mb-2">They sign up</h4>
										<p className="text-lg text-gray-900 dark:text-gray-100">
											Your friends use your code when signing up
										</p>
									</div>
									<div className="p-4 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
										<div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
											<span className="text-2xl font-medium text-amber-600">
												3
											</span>
										</div>
										<h4 className="font-semibold mb-2">Earn points</h4>
										<p className="text-lg text-gray-900 dark:text-gray-100">
											Receive points for each successful referral
										</p>
									</div>
								</div>
							</div>
						</Card>
					</TabsContent>

					{/* Loyalty Tab */}
					<TabsContent value="loyalty" className="space-y-6">
						<Card className="p-6">
							<div>
								<div className="flex items-center gap-4 mb-8">
									<Award className="w-8 h-8 text-amber-500" />
									<h2 className="  text-2xl font-medium  text-gray-900 dark:text-gray-100">
										Programme Loyalty
									</h2>
								</div>
								<div className="space-y-6">
									<Card className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-900 shadow-xl rounded-3xl p-6 relative">
										<div className="flex items-center gap-4 mb-4">
											<div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
												<Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
											</div>
											<div>
												<h3 className="text-xl  text-gray-900 dark:text-gray-100">
													Your Status
												</h3>
												<Badge className="bg-amber-500 text-white">
													{loyaltyTier || "Standard"}
												</Badge>
											</div>
										</div>
										<Card className="p-6 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-900/30 rounded-3xl">
											{/* <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Programme de Loyalty
                    </h4> */}
											<div className="space-y-4">
												{canClaimGiftCard ? (
													<>
														<p className="text-base text-gray-400 mb-3">
															Get more {selectedClient?.loyaltyPoints || 0}{" "}
															points, you can claim free gift cards.
														</p>
														<Button
															className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
															onClick={handleApplyLoyaltyBonus}
														>
															Claim free gift card 🎁
														</Button>
													</>
												) : (
													<>
														<div className="flex justify-between items-center">
															<span className="text-base text-gray-700 dark:text-gray-400 font-medium">
																Current Points
															</span>
															<span className="text-2xl text-gray-900 dark:text-gray-100 font-black">
																{selectedClient?.loyaltyPoints || 0} pts
															</span>
														</div>
														<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
															<div
																className="bg-linear-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
																style={{
																	width: `${(loyaltyPoints / selectedClient?.loyaltyPoints) * 100}%`,
																}}
															/>
														</div>
														<p className="text-base text-gray-600 dark:text-gray-400 italic">
															Only{" "}
															{selectedClient?.loyaltyPoints -
																(loyaltyPoints || 0)}{" "}
															points until your next reward!
														</p>
														<p className="text-base mb-3">
															Earn points with every service to unlock gift
															cards.
														</p>
													</>
												)}
											</div>
										</Card>
									</Card>
								</div>
							</div>
							{/* Loyalty Stats & Info */}
							<div>
								<Accordion type="single" collapsible className="w-full">
									<AccordionItem value="item-1">
										<AccordionTrigger>How to earn points?</AccordionTrigger>
										<AccordionContent>
											Earn 1 point for every 1000 CDF spent. Get bonus points
											for birthdays, referrals, and event participation.
										</AccordionContent>
									</AccordionItem>
									<AccordionItem value="item-2">
										<AccordionTrigger>
											What are the reward tiers?
										</AccordionTrigger>
										<AccordionContent>
											<ul className="list-disc pl-5 space-y-1">
												<li>100 points: Free manicure</li>
												<li>250 points: Free eyelash extension</li>
												<li>500 points: 50% off all services</li>
												<li>1000 points: Free full beauty day</li>
											</ul>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>

							{/* Loyalty Transactions */}
							<h3 className="text-lg font-semibold mb-4">Point History</h3>
							<div className="space-y-3">
								{transactions.length === 0 ? (
									<div className="text-center py-8 text-gray-500">
										<TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
										<p>No transactions</p>
									</div>
								) : (
									transactions.slice(0, 10).map((transaction) => (
										<div
											key={transaction.id}
											className="flex items-center justify-between py-3 border-b last:border-0"
										>
											<div className="flex items-center gap-3">
												<div
													className={`p-2 rounded-lg ${
														transaction.points > 0
															? "bg-green-100"
															: "bg-red-100"
													}`}
												>
													<TrendingUp
														className={`w-4 h-4 ${
															transaction.points > 0
																? "text-green-600"
																: "text-red-600"
														}`}
													/>
												</div>
												<div>
													<p className="font-medium">
														{transaction.description}
													</p>
													<p className="text-lg text-gray-500">
														{formatDate(transaction.createdAt)}
													</p>
												</div>
											</div>
											<p
												className={`text-lg  ${
													transaction.points > 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{transaction.points > 0 ? "+" : ""}
												{transaction.points} pts
											</p>
										</div>
									))
								)}
							</div>
						</Card>
					</TabsContent>

					<TabsContent value="profile" className="space-y-6">
						{/* Client Profilee */}
						<Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:col-span-2">
							<p className=" dark:text-pink-400 text-xs sm:text-xs">
								{"glisser  <--- | --->"}
							</p>
							<Tabs defaultValue="profile" className="space-y-8">
								<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
									<TabsTrigger
										value="profile"
										className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm"
									>
										Profile
									</TabsTrigger>
									<TabsTrigger
										value="history"
										className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm"
									>
										Visit History
									</TabsTrigger>
									<TabsTrigger
										value="notifications"
										className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm"
									>
										Notifications
									</TabsTrigger>
									<TabsTrigger
										value="finances"
										className="rounded-lg px-4 sm:px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-pink-400 shadow-sm"
									>
										Finance
									</TabsTrigger>

								</TabsList>

								{/* Profilee Tab */}
								<TabsContent value="profile" className="space-y-8">
									{selectedClient && (
										<>
											<div className="flex flex-col sm:flex-row items-start justify-between gap-6">
												<div className="flex items-center gap-4 sm:gap-6">
													<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium sm:text-3xl font-medium font-black shadow-lg shadow-pink-500/20">
														{selectedClient.name.charAt(0)}
													</div>
													<div>
														<h3 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100 font-black mb-2">
															{selectedClient.name}
														</h3>
														<div className="flex flex-wrap gap-3">
															<Badge className="bg-amber-500 dark:bg-amber-600 text-white border-0 px-3 py-1  shadow-md shadow-amber-500/10">
																{selectedClient.membershipStatus}
															</Badge>
															<Badge
																variant="outline"
																className="border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 px-3 py-1 "
															>
																ID: #{selectedClient.id.slice(0, 4)}
															</Badge>
														</div>
													</div>
												</div>
												<ClientModalTrigger client={selectedClient} edit={true}>
													<Button
														variant="outline"
														className="rounded-full py-5 px-6 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300  transition-all text-lg"
													>
														Edit Profile
													</Button>
												</ClientModalTrigger>
											</div>
											{/* <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">

                      

                    </div> */}

											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-4">
													<h4 className="text-base sm:text-lg font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
														Contact Information
													</h4>
													<div className="space-y-3 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
														<p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
															<div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
																<Phone className="w-4 h-4 text-pink-500" />
															</div>
															{selectedClient.phone}
														</p>
														<p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
															<div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
																<Mail className="w-4 h-4 text-pink-500" />
															</div>
															{selectedClient.email}
														</p>
														<p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
															<div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
																<Cake className="w-4 h-4 text-pink-500" />
															</div>
															{selectedClient.birthday}
														</p>
														<p className="flex items-center gap-3 text-lg sm:text-base text-gray-700 dark:text-gray-300">
															<div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
																<MapPin className="w-4 h-4 text-pink-500" />
															</div>
															{selectedClient.address}
														</p>
													</div>
												</div>

												<div className="space-y-4">
													<h4 className="text-base sm:text-lg font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
														Notes & Others
													</h4>
													<div className="space-y-4">
														<div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
															<p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
																{selectedClient?.notes}
															</p>
														</div>
														<div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
															<p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">
																Allergies
															</p>
															<p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
																{selectedClient?.allergies}
															</p>
														</div>
													</div>
												</div>
											</div>

											{/* {selectedClient && (
                      <Card className="p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl">
                        <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-widest flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-purple-500" />
                          Membership
                        </h4>
                        <ManageClientMembership clientId={selectedClient.id} />
                      </Card>
                    )} */}

											<div className="p-6 bg-pink-50 dark:bg-pink-900/10 rounded-3xl border border-pink-100 dark:border-pink-900/30">
												<h4 className="text-base font-black text-pink-600 dark:text-pink-400 uppercase tracking-[0.2em] mb-4">
													Favorite Services
												</h4>
												<div className="flex flex-wrap gap-2">
													{selectedClient?.favoriteServices?.map(
														(service: any, idx: any) => (
															<Badge
																key={idx}
																className="bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 py-2 px-4 text-base  rounded-full transition-all"
															>
																{service}
															</Badge>
														),
													)}
												</div>
											</div>
										</>
									)}
								</TabsContent>

								{/* History Tab */}
								<TabsContent value="history" className="space-y-6">
									<div className="flex items-center justify-between">
										<h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100  flex items-center gap-2">
											<CalendarIcon className="w-5 h-5 text-pink-500" />
											Visit History
										</h4>
										<Button
											variant="outline"
											size="sm"
											className="rounded-full text-base  dark:border-gray-700"
										>
											Exporter PDF
										</Button>
									</div>
									<div className="space-y-3">
										{appointmentHistory.map((apt, idx) => (
											<div
												key={idx}
												className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all gap-4"
											>
												<div className="flex items-center gap-4">
													<div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
														<CalendarIcon className="w-5 h-5 text-pink-500" />
													</div>
													<div>
														<p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 ">
															{apt.service?.name}
														</p>
														<p className="text-base text-gray-500 dark:text-gray-400">
															avec {apt.worker.name} • {apt.date}
														</p>
													</div>
												</div>
												<div className="flex items-center justify-between w-full sm:w-auto gap-4">
													<p className="text-lg sm:text-base font-black text-gray-900 dark:text-gray-100">
														{apt.price}
													</p>
													<Badge
														className={`bg-green-500/10 ${apt.status === "completed" ? "text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30" : apt.status === "cancelled" ? "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30" : ""} px-3 py-1 text-[10px] `}
													>
														{apt.status}
													</Badge>
												</div>
											</div>
										))}
									</div>
								</TabsContent>

								{/* Notifications Tab */}
								<TabsContent value="notifications" className="space-y-6">
									<div className="flex items-center justify-between">
										<h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100  flex items-center gap-2">
											<Bell className="w-5 h-5 text-pink-500" />
											Sent Communications
										</h4>
									</div>
									<div className="space-y-3">
										{notificationList.slice(0, 10).map((notif, idx) => (
											<div
												key={idx}
												className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all gap-4"
											>
												<div className="flex items-center gap-4">
													<div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
														{notif.type === "appointment_reminder" ? (
															<Clock className="w-5 h-5 text-blue-500" />
														) : notif.type === "appointment_confirmed" ? (
															<Mail className="w-5 h-5 text-green-500" />
														) : (
															<Gift className="w-5 h-5 text-purple-500" />
														)}
													</div>
													<div>
														<p className="text-lg sm:text-base text-gray-900 dark:text-gray-100 ">
															{notif.message}
														</p>
														<p className="text-base text-gray-500 dark:text-gray-400">
															{notif.type} • {notif.createdAt}
														</p>
													</div>
												</div>
												<Badge
													variant="outline"
													className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 text-[10px] "
												>
													{notif.isRead ? "Lu" : "Unread"}
												</Badge>
											</div>
										))}
									</div>
								</TabsContent>

								{/* Finances Tab */}
								<TabsContent value="finances" className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<Card className="p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-100 dark:border-green-900/30 rounded-3xl">
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
													<CreditCard className="w-6 h-6 text-green-600" />
												</div>
												<div>
													<p className="text-base font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
														Prepaid Balance
													</p>
													<p className="text-2xl font-black text-gray-900 dark:text-gray-100">
														{Number(selectedClient?.prepaymentBalance)
															.toFixed(2)
															.toLocaleString()}{" "}
														CDF
													</p>
												</div>
											</div>

											<Popover>
												<PopoverTrigger asChild>
													<Button
														size="sm"
														className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md shadow-green-500/20 flex items-center justify-center gap-2"
													>
														<Info className="w-4 h-4" />
														Understand this balance
													</Button>
												</PopoverTrigger>

												<PopoverContent className="w-80 rounded-2xl border-green-100 dark:border-green-900/30 p-4">
													<div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
														<p className="font-semibold text-green-600">
															💡 Why does this balance exist?
														</p>
														<p>
															This balance allows you to manage missed
															appointments and rescheduled ones without losing
															value.
														</p>

														<p className="font-semibold text-green-600">
															⚙️ How does it work?
														</p>
														<ul className="list-disc pl-4 space-y-1">
															<li>➕ Increases if an appointment is missed</li>
															<li>➖ Decreases when rescheduling</li>
															<li>Usable when paying for a service</li>
														</ul>

														<p className="font-semibold text-green-600">
															⚠️ Important Rules
														</p>
														<ul className="list-disc pl-4 space-y-1">
															<li>The balance can never be negative</li>
															<li>
																Usable only if the amount covers the service
															</li>
															<li>
																Otherwise, the option is automatically disabled
															</li>
														</ul>
													</div>
												</PopoverContent>
											</Popover>
										</Card>
										<Card className="p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-100 dark:border-pink-900/30 rounded-3xl">
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
													<Gift className="w-6 h-6 text-purple-600" />
												</div>
												<div>
													<p className="text-base font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
														Gift Card
													</p>
													<p className="text-2xl font-medium text-gray-900 dark:text-gray-100">
														{Number(selectedClient?.giftCardBalance)
															.toFixed(2)
															.toLocaleString()}{" "}
														CDF
													</p>
												</div>
											</div>

											<Popover>
												<PopoverTrigger asChild>
													<Button
														size="sm"
														className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
													>
														<Info className="w-4 h-4" />
														How it works
													</Button>
												</PopoverTrigger>

												<PopoverContent className="w-80 rounded-2xl border-purple-100 dark:border-purple-900/30 p-4">
													<div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
														<p className="font-semibold text-purple-600">
															🎁 What is a gift card?
														</p>
														<p>
															It is a gifted amount that you can use to pay for
															your services.
														</p>

														<p className="font-semibold text-purple-600">
															💳 Usage
														</p>
														<ul className="list-disc pl-4 space-y-1">
															<li>Valid as a payment method</li>
															<li>Can cover part or all of a service</li>
														</ul>

														<p className="font-semibold text-purple-600">
															⚠️ Good to know
														</p>
														<ul className="list-disc pl-4 space-y-1">
															<li>Non-exchangeable for cash</li>
															<li>Valid only in the salon</li>
														</ul>
													</div>
												</PopoverContent>
											</Popover>
										</Card>
									</div>
								</TabsContent>

							</Tabs>
						</Card>
					</TabsContent>

					{/* Tasks Tab */}
					<TabsContent value="tasks" className="space-y-6">
						{/* Tasks Management */}
						<div className="py-2">
							<TasksManagement />
						</div>
					</TabsContent>
				</Tabs>

			</div>

			{/* Cancel Appointment Dialog */}
			<Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Appointment</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel this appointment?
						</DialogDescription>
					</DialogHeader>

					{selectedAppointment && (
						<div className="py-4">
							<div className="p-4 bg-white dark:bg-gray-800 rounded-lg space-y-2">
								<p className="font-semibold">
									{selectedAppointment.service?.name}
								</p>
								<p className="text-lg text-gray-900 dark:text-gray-100">
									{formatDate(selectedAppointment.date)} at{" "}
									{selectedAppointment.time}
								</p>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCancelDialogOpen(false)}
						>
							Back
						</Button>
						<Button
							variant="destructive"
							// onClick={handleCancelAppointment}
						>
							Confirm Cancellation
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Review Dialog */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Leave a Review</DialogTitle>
						<DialogDescription>How was your appointment?</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Star Rating */}
						<div>
							<label className="text-lg font-medium mb-2 block">Rating</label>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										onClick={() => setRating(star)}
										className="focus:outline-none"
									>
										<Star
											className={`w-8 h-8 ${
												star <= rating
													? "fill-yellow-400 text-yellow-400"
													: "text-gray-300"
											}`}
										/>
									</button>
								))}
							</div>
						</div>

						{/* Review Text */}
						<div>
							<label className="text-lg font-medium mb-2 block">
								Comment (optional)
							</label>
							<Textarea
								placeholder="Share your experience..."
								value={reviewText}
								onChange={(e) => setReviewText(e.target.value)}
								rows={4}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setReviewDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitReview}
							disabled={rating === 0}
							className="bg-linear-to-r from-pink-500 to-purple-500"
						>
							Submit Review
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
