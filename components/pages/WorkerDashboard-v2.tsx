"use client";

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	Award,
	Bell,
	Building,
	CalendarIcon,
	CheckCheck,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	DollarSign,
	Download,
	ExternalLink,
	FileText,
	Info,
	Loader2,
	MapPin,
	MessageSquare,
	Package,
	Phone,
	PlayCircle,
	Settings,
	ShoppingCart,
	Sparkles,
	Star,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
	useCommission,
	useWorker,
	useWorkerCommission,
} from "@/lib/hooks/useStaff";
import { usePendingTransfers } from "@/lib/hooks/useTransfers";
import { useWorkerProfile } from "@/lib/hooks/useWorkerProfile";
import AppointmentCountdown from "../AppointmentCountdown";
import BookingCalendar from "../BookingCalendar";
import LoaderBN from "../Loader-BN";
import InventorySelectionModal from "../modals/InventorySelectionModal";
import { StaffModal } from "../modals/StaffModals-v2";
import TransferAppointmentModal from "../modals/TransferAppointmentModal";
import { Frequency, getNextResetDate, PayrollCountdown } from "../PayrollCountdown";
import TransferRequestCard from "../TransferRequestCard";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import TasksManagement from "../TasksManagement";
import { PayrollModal } from "../modals/PayrollModal";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function WorkerDashboardV2() {
	const [notificationOpen, setNotificationOpen] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [freqComm, setFreqComm] = useState("");
	const [showTransfers, setShowTransfers] = useState(true);
	const [showInventorySelection, setShowInventorySelection] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const router = useRouter();
	// Get authenticated user
	const { user, isLoading: isAuthLoading } = useAuth();
	const { data: worker, isLoading: isWorkerLoading } = useWorker(
		user?.workerProfile?.id || "",
	);

	const {
		profile: workerProfile,
		isLoading: isWorkerProfileLoading,
		error: workerProfileError,
	} = useWorkerProfile(user?.workerProfile?.id || "");
	const {
		data: currentPeriodCommissionData,
		isLoading: isCurrentPeriodCommissionLoading,
	} = useWorkerCommission(
		user?.workerProfile?.id || "",
		workerProfile?.commissionFrequency,
	);
	const { commissions: allCommissions, isLoading: isAllCommissionsLoading } =
		useCommission(); // Fetch all commissions for history

	const {
		data: pendingTransfers = [],
		isLoading: transfersLoading,
		refetch: refetchTransfers,
	} = usePendingTransfers();

	// Get appointments (today for schedule tab)
	const {
		appointments = [],
		isLoading: isAppointmentsLoading,
		updateStatus,
		refetch,
	} = useAppointments({
		workerId: user?.workerProfile?.id,
	});


	// Get weekly appointments for stats
	const weekStart = new Date();
	weekStart.setDate(weekStart.getDate() - weekStart.getDay());

	const [selectedPeriod, setSelectedPeriod] = useState<string>(
		user?.workerProfile?.commissionFrequency || "daily",
	);

	// Filter commissions for the current worker if using the global hook
	const workerCommissions =
		allCommissions?.filter((c) => (c.workerId === user?.workerProfile?.id && !c.commissionInitializedAtAppointmentCompletion)) || [];

	// Determine if commission settings are incomplete
	const isCommissionConfigIncomplete =
		workerProfile &&
		(!workerProfile.commissionFrequency ||
			!workerProfile.commissionDay ||
			workerProfile.minimumPayout === undefined);

	// Prepare data for the weekly performance chart
	const weeklyData = useMemo(() => {
		// This assumes currentPeriodCommissionData contains aggregated data per day or a similar structure
		// If the API doesn't provide this format, you might need to process workerCommissions or allCommissions
		if (currentPeriodCommissionData && Array.isArray(currentPeriodCommissionData)) {
			// If currentPeriodCommissionData is an array of daily stats
			return currentPeriodCommissionData.map((item) => ({
				day: item.day || item.period || "Unknown", // Adjust key based on actual API response
				rendezVous: item.appointmentsCount || 0,
				commission: item.commission || 0,
				totalRevenue: item.totalRevenue || 0,
			}));
		} else if (
			currentPeriodCommissionData &&
			typeof currentPeriodCommissionData === "object"
		) {
			// If currentPeriodCommissionData is a single object with daily breakdowns
			// Example: { mon: { appointmentsCount: 2, ... }, tue: { ... }, ... }
			return Object.entries(currentPeriodCommissionData).map(
				([day, data]: [string, any]) => ({
					day,
					rendezVous: data.appointmentsCount || 0,
					commission: data.commission || 0,
					totalRevenue: data.totalRevenue || 0,
				}),
			);
		}
		// Fallback: Generate empty data for the chart
		return [
			{ day: "Mon", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Tue", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Wed", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Thu", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Fri", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Sat", rendezVous: 0, commission: 0, totalRevenue: 0 },
			{ day: "Sun", rendezVous: 0, commission: 0, totalRevenue: 0 },
		];
	}, [currentPeriodCommissionData]);

	useEffect(() => {
		if (workerProfile && workerProfile.commissionFrequency)
			setFreqComm(workerProfile.commissionFrequency);
	});

	// Calculate next payment date based on profile settings (placeholder logic)
	const getNextPaymentDate = () => {
		if (!workerProfile?.commissionFrequency || !workerProfile?.commissionDay)
			return "To configure";
		// This is simplified - actual calculation would depend on frequency and day
		if (freqComm === "monthly")
			return `On the ${getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDate()}th of each month`;
		else if (freqComm === "weekly")
			return `[${getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).toLocaleDateString()}] ${getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 0 ? "Sunday" : getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 1 ? "Monday" : getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 2 ? "Tuesday" : getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 3 ? "Wednesday" : getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 4 ? "Thursday" : getNextResetDate(workerProfile.commissionFrequency as Frequency, workerProfile.commissionDay).getDay() === 5 ? "Friday" : "Saturday"} -  your payment will be processed`;
		else return `[Tonight] - your payment will be proceesed.`;
	};

	// Handle saving commission settings (example action)
	const handleConfigureCommission = () => {
		// Navigate to profile edit or open a specific modal
		// Example: router.push('/profile/edit') or setOpenCommissionSetupModal(true)
		toast.info("Please configure your commission settings in your profile.");
	};

	// Get notifications
	const {
		notifications: notificationList = [],
		unreadCount = 0,
		markAsRead,
	} = useNotifications({ limit: 50 });

	// Filter appointments by status
	const todaySchedule = appointments.filter(
		(apt) =>
			(apt.status === "confirmed" ||
				apt.status === "in_progress" ||
				apt.status === "pending") &&
			new Date(apt.date).getDate() >= new Date().getDate(),
	);

	const pendingAppointments = appointments.filter(
		(apt) =>
			(apt.status === "confirmed" || apt.status === "pending") &&
			new Date(apt.date).getDate() >= new Date().getDate(),
	);

	const completedToday = appointments.filter(
		(apt) => apt.status === "completed",
	);

	const missedAppointments = appointments.filter(
		(apt) => apt.status === "pending" && new Date(apt.date) < new Date(),
	);
	const completedAppointments = appointments.filter(
		(apt) => apt.status === "completed",
	);
	const cancelledAppointments = appointments.filter(
		(apt) => apt.status === "cancelled",
	);

	// Stats for the summary cards and performance section
	const stats = useMemo(() => {
		// Calculate stats based on currentPeriodCommissionData or workerProfile
		const commission = currentPeriodCommissionData?.commission || 0;
		const totalRevenue = currentPeriodCommissionData?.totalRevenue || 0;
		const totalBusinessEarnings =
			currentPeriodCommissionData?.totalBusiness || 0;
		const materialsCost = currentPeriodCommissionData?.matCost || 0;
		const operationsCost = currentPeriodCommissionData?.operaCost || 0;
		const rating = workerProfile?.rating || 0; // Assuming rating comes from profile

		return {
			commission,
			revenue: totalRevenue,
			rating,
			totalBusinessEarnings,
			materialsCost,
			operationsCost,
			todayAppointments: todaySchedule.length,
			completed: completedToday.length,
			pending: pendingAppointments.length,
		};
	}, [currentPeriodCommissionData, workerProfile]);

	// Handle update status
	const handleUpdateStatus = (appointmentId: string, newStatus: string) => {
		setIsUpdating(true);
		updateStatus(
			{
				id: appointmentId,
				statusData: { status: newStatus as any },
			},
			{
				onSuccess: () => {
					toast.success("Status updated");
					setDetailsOpen(false);

					refetch();
					router.refresh();
					setIsUpdating(false);
				},
			},
		);
	};

	// Get status badge
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "confirmed":
				return (
					<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
						<Clock className="w-3 h-3 mr-1" />
						Confirmed
					</Badge>
				);
			case "in_progress":
				return (
					<Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
						<PlayCircle className="w-3 h-3 mr-1" />
						In Progress
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-green-100 text-green-700 hover:bg-green-100">
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
			case "no_show":
				return (
					<Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
						<AlertCircle className="w-3 h-3 mr-1" />
						No Show
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
						<Clock className="w-3 h-3 mr-1" />
						Pending
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	// Get notification icon
	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "appointment_confirmed":
				return <CalendarIcon className="w-5 h-5 text-blue-500" />;
			case "appointment_cancelled":
				return <XCircle className="w-5 h-5 text-red-500" />;
			default:
				return <Bell className="w-5 h-5 text-gray-500" />;
		}
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			day: "numeric",
			month: "long",
		});
	};

	// derive from/to ISO strings from the selected period
	const { from, to } = useMemo(() => {
		const getPeriodRange = (p: string) => {
			const now = new Date();
			const to = now.toISOString();
			const fromDate = new Date();
			switch (p) {
				case "weekly":
					fromDate.setDate(now.getDate() - 7);
					break;
				case "monthly":
					fromDate.setMonth(now.getMonth() - 1);
					break;
				default:
					fromDate.setDate(now.getDate() - 1); // Last 24 hours
			}
			return { from: fromDate.toISOString(), to };
		};
		return getPeriodRange(selectedPeriod);
	}, [selectedPeriod]); // Only recalculate when period changes

	// Loading state
	if (isAuthLoading || isAppointmentsLoading || isWorkerLoading) {
		return <LoaderBN />;
	}

	// Redirect if not authenticated or not a worker
	if (!user || user.role !== "worker") {
		router.push("/");
	}

	const printCommissionReport = (commission: any) => {
		const params = new URLSearchParams({
			commissionId: commission.id,
			from,
			to,
		});

		window.open(
			`/api/commissions/worker-report?${params.toString()}`,
			"_blank",
		);
	};
	const printCommissionReportV2 = () => {
		// No need to pass commissionId - route calculates period automatically
		const params = new URLSearchParams({
			from, // optional: override calculated period
			to, // optional: override calculated period
			pdf: "true", // to get PDF directly
			workerId: user?.workerProfile?.id || "", // Pass worker ID to filter data
		});

		window.open(
			`/api/commissions/worker-report-v2?${params.toString()}`,
			"_blank",
		);
	};

	return (
		<div className="min-h-screen py-8 bg-linear-to-br from-purple-50 via-pink-50 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-12">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
						<div>
							<h1 className="text-3xl font-semibold sm:text-4xl  bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
								Staff Dashboard
							</h1>
							<p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
								Hello, {user?.name} 👋
							</p>
						</div>

						<div className="space-x-4 flex items-center w-full justify-between md:justify-end">
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
								<SheetContent className="p-2 border-r-0 border-pink-100 dark:border-pink-900 shadow-xl rounded-l-2xl bg-white dark:bg-gray-950">
									<h2 className="text-2xl   mb-6 dark:text-gray-100">
										Notifications
									</h2>
									<ScrollArea className="h-[calc(100vh-150px)]">
										<div className="space-y-4">
											{notificationList.length === 0 ? (
												<div className="text-center py-12 text-gray-500 dark:text-gray-400">
													<Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
													<p>No notifications</p>
												</div>
											) : (
												notificationList.map((notification) => (
													<div
														key={notification.id}
														className={`p-4 rounded-lg border cursor-pointer dark:border-gray-700 ${
															notification.isRead
																? "bg-white dark:bg-gray-800"
																: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
														}`}
														onClick={() => markAsRead(notification.id)}
													>
														<div className="flex gap-3">
															{getNotificationIcon(notification.type)}
															<div className="flex-1">
																<h3 className="font-semibold text-lg mb-1">
																	{notification.title}
																</h3>
																<p className="text-lg text-gray-600 dark:text-gray-300">
																	{notification.message}
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
							<StaffModal
								staffId={worker?.id || ""}
								trigger={
									<Avatar className="w-12 h-12 border-4 border-white shadow-lg">
										<AvatarImage src={worker?.avatar || ""} />
										<AvatarFallback className="text-2xl font-medium bg-gray-100 text-gray-600">
											{worker?.name.split(" ")[0]?.charAt(0) ||
												worker?.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
								}
							/>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
						{/* Card 1 */}
						<Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
							<div className="flex items-center justify-between mb-2">
								<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
									<CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
								</div>
							</div>

							<p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
								Today
							</p>

							<p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
								{stats.todayAppointments}
							</p>

							<p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
								{stats.completed} completed
							</p>
						</Card>

						{/* Card 2 */}
						<Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
							<div className="flex items-center justify-between mb-2">
								<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
									<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
								</div>
							</div>

							<p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
								Completed
							</p>

							<p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
								{completedAppointments.length}
							</p>

							<p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
								appointments
							</p>
						</Card>

						{/* Card 3 */}
						<Card className="p-3 sm:p-5 hover:shadow-md transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-lg rounded-xl bg-white dark:bg-gray-950">
							<div className="flex items-center justify-between mb-2">
								<div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
									<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
								</div>
							</div>

							<p className="text-lg sm:text-lg font-medium text-gray-600 dark:text-gray-300">
								Pending
							</p>

							<p className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
								{stats.pending}
							</p>

							<p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
								{missedAppointments.length} missed
							</p>
						</Card>

						{/* Card 4 */}
						<Card className="p-3 sm:p-5 bg-linear-to-br from-amber-500 to-pink-500 text-white border-0 shadow-lg rounded-xl">
							<div className="flex items-center justify-between mb-2">
								<div className="p-2 bg-white/20 rounded-md backdrop-blur-sm">
									<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
								</div>
								<Star className="w-3 h-3 sm:w-4 sm:h-4" />
							</div>

							<p className="text-lg sm:text-lg font-medium opacity-90">
								Revenue Generated
							</p>

							<p className="text-2xl sm:text-4xl font-semibold">
								{stats.revenue} CDF
							</p>

							<p className="text-sm sm:text-base opacity-80 mt-1">
								{user?.workerProfile?.commissionFrequency === "mothly"
									? "This Month"
									: user?.workerProfile?.commissionFrequency === "weekly"
										? "Last 7 Days"
										: "Today"}
							</p>
						</Card>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
						{/* 💰 Worker Earnings */}
						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
							<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{worker?.totalEarnings?.toLocaleString()} CDF
							</p>
							<p className="text-sm text-gray-500 uppercase">Your Earnings</p>
						</div>

						{/* 🏢 Business Revenue */}
						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<Building className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
							<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{worker?.businessRevenue?.toLocaleString()} CDF
							</p>
							<p className="text-sm text-gray-500 uppercase">Salon Share</p>
						</div>

						{/* 🧴 Materials */}
						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<Package className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
							<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{worker?.materialsReserve?.toLocaleString()} CDF
							</p>
							<p className="text-sm text-gray-500 uppercase">Materials</p>
						</div>

						{/* ⚙️ Operational */}
						<div className="p-4 sm:p-5 h-full cursor-pointer hover:shadow-lg transition-shadow border border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between text-center">
							<Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
							<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{worker?.operationalCosts?.toLocaleString()} CDF
							</p>
							<p className="text-sm text-gray-500 uppercase">Operating Costs</p>
						</div>
					</div>
				</div>

				{/* Transfer Requests Section */}

				{pendingTransfers.length > 0 && (
					<Card className="overflow-hidden border-0 shadow-2xl bg-linear-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/10 dark:to-background rounded-3xl">
						{/* Header */}
						<div className="p-5 sm:p-7 border-b border-pink-100/70 dark:border-pink-900/20 bg-white/70 dark:bg-background/40 backdrop-blur">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								{/* Left */}
								<div className="flex items-center gap-4">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/20">
										<AlertCircle className="w-7 h-7 text-white" />
									</div>

									<div>
										<h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
											Transfer Requests
										</h3>

										<p className="text-base text-pink-700 dark:text-pink-300 mt-1">
											You have {pendingTransfers.length} pending transfere
											{pendingTransfers.length > 1 ? "s" : ""} en attente
										</p>
									</div>
								</div>

								{/* Right */}
								<div className="flex items-center gap-3">
									<Badge className="rounded-full px-5 py-2 text-sm font-semibold bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-800">
										Action requise
									</Badge>

									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowTransfers(!showTransfers)}
										className="rounded-xl border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-background/40 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all duration-300"
									>
										{showTransfers ? (
											<>
												<ChevronUp className="w-4 h-4 mr-2" />
												hide
											</>
										) : (
											<>
												<ChevronDown className="w-4 h-4 mr-2" />
												show
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						{/* Foldable Content */}
						<div
							className={`transition-all duration-500 ease-in-out overflow-hidden ${
								showTransfers ? "max-h-225 opacity-100" : "max-h-0 opacity-0"
							}`}
						>
							<div className="max-h-175 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-pink-300 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent">
								<div className="space-y-5">
									{pendingTransfers.map((transfer) => (
										<TransferRequestCard
											key={transfer.id}
											transfer={transfer}
											onAccepted={() => {
												refetchTransfers();
												refetch();
											}}
											onRejected={() => refetchTransfers()}
										/>
									))}
								</div>
							</div>
						</div>
					</Card>
				)}

				{/* Main Content */}
				<p className=" dark:text-pink-400 text-xs sm:text-xs">
					{"glisser  <--- | --->"}
				</p>
				<Tabs defaultValue="schedule" className="space-y-6">
					<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
						<TabsTrigger
							value="schedule"
							className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
						>
							<CalendarIcon className="w-4 h-4 mr-2" />
							Planning
						</TabsTrigger>
						<TabsTrigger
							value="calendar"
							className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
						>
							<CalendarIcon className="w-4 h-4 mr-2" />
							My Calendar
						</TabsTrigger>
						<TabsTrigger
							value="tasks"
							className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
						>
							<CalendarIcon className="w-4 h-4 mr-2" />
							My Tasks
						</TabsTrigger>
						<TabsTrigger
							value="performance"
							className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
						>
							<TrendingUp className="w-4 h-4 mr-2" />
							Performance
						</TabsTrigger>
					</TabsList>

					{/* Schedule Tab */}
					<TabsContent value="schedule" className="space-y-6">
						<Card className="p-6">
							<div className="flex flex-col md:flex-row items-center justify-start md:justify-between mb-6 gap-4">
								<h2 className="text-2xl   mb-6 flex items-center">
									<Clock className="w-6 h-6 mr-2 text-purple-500" />
									Today's Planning
								</h2>
							</div>

							{todaySchedule.length === 0 ? (
								<div className="text-center py-12 text-gray-500">
									<CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
									<p>No appointments today</p>
								</div>
							) : (
								<div className="space-y-4">
									{todaySchedule.map((appointment) => (
										<div
											key={appointment.id}
											className=" p-6 hover:shadow-lg border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
												<div className="flex items-center gap-4 flex-1">
													<div className="text-center">
														<div className="text-2xl  text-purple-600">
															{appointment.time}
														</div>
														<div className="text-base text-gray-500">
															{appointment.duration} min
														</div>
													</div>

													<div className="flex-1">
														<div className="flex items-center gap-3 mb-2">
															<Avatar>
																<AvatarFallback>
																	{appointment.client?.user?.name?.charAt(0) ||
																		"C"}
																</AvatarFallback>
															</Avatar>
															<div>
																<h3 className="font-semibold text-lg">
																	{appointment.client?.user?.name || "Client"}
																</h3>
																<p className="text-lg text-gray-600 dark:text-gray-300">
																	{appointment.service?.name}
																</p>
															</div>
														</div>

														<div className="flex flex-wrap gap-3 text-lg text-gray-600 dark:text-gray-300">
															<div className="flex items-center gap-1">
																<Phone className="w-4 h-4" />
																{appointment.client?.user?.phone || "N/A"}
															</div>
															<div className="flex items-center gap-1">
																<MapPin className="w-4 h-4" />
																{appointment.location === "salon"
																	? "Salon"
																	: "Domicile"}
															</div>
															<div className="flex items-center gap-1">
																<CalendarIcon className="w-4 h-4" />
																{appointment.date
																	? format(new Date(appointment.date), "PPP", {
																			locale: enUS,
																		})
																	: "Date non définie"}
															</div>
														</div>

														{appointment.notes && (
															<div className="mt-2 p-2 bg-yellow-50 rounded text-lg">
																<MessageSquare className="w-4 h-4 inline mr-1" />
																{appointment.notes}
															</div>
														)}
													</div>
													{appointment.package && (
														<Badge className="bg-purple-500 text-white">
															<Sparkles className="w-3 h-3 mr-1" />
															Forfait: {appointment.package.name}
														</Badge>
													)}
												</div>
												<div className="flex flex-col gap-2 items-end">
													{/* Status Badge */}
													{getStatusBadge(appointment.status)}

													{/* Transfer Badge */}
													{appointment.transfer?.originalWorkerId ===
														user?.id && (
														<Badge
															variant="outline"
															className="flex items-center gap-1"
														>
															<ArrowRight className="w-3 h-3" />
															You have transfered this appointment to{" "}
															{appointment.transfer?.newWorker?.user?.name}.
														</Badge>
													)}
													{appointment.transfer?.originalWorkerId ===
														user?.id && (
														<Badge
															variant="outline"
															className="flex items-center gap-1"
														>
															<ArrowRight className="w-3 h-3" />
															You have transfered this appointment to{" "}
															{appointment.transfer?.newWorker?.user?.name}.
														</Badge>
													)}
													{appointment.transfer?.newWorkerId === user?.id && (
														<Badge
															variant="outline"
															className="flex items-center gap-1"
														>
															<ArrowRight className="w-3 h-3" />
															This appointment has been transfered to you from{" "}
															{appointment.transfer?.originalWorker?.user?.name}.
														</Badge>
													)}

													{appointment.transfer && (
														<Badge
															variant={
																appointment.transfer.status === "accepted"
																	? "default"
																	: "outline"
															}
															className={
																appointment.transfer.status === "pending"
																	? "border-amber-500 text-amber-600"
																	: ""
															}
														>
															{appointment.transfer.status === "pending" &&
																"													🔄 Transferring"}
															{appointment.transfer.status === "accepted" && 
																"✓						Transferred"}
															{appointment.transfer.status === "rejected" &&
																"✗						Declined"}
														</Badge>
													)}

													{/* Transfer Button - only show if user can transfer */}
													{user?.role === "worker" &&
														appointment.worker?.user?.id === user.id &&
														appointment.status === "confirmed" &&
														!appointment.transfer && (
															<TransferAppointmentModal
																appointment={appointment}
																trigger={
																	<Button
																		size="sm"
																		variant="outline"
																		className="text-pink-600 hover:text-pink-700"
																	>
																		<ArrowRight className="w-4 h-4 mr-1" />
																		Transfer
																	</Button>
																}
															/>
														)}

													{/* Details Button */}
													{!appointment.transfer && (
														<>
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setSelectedAppointment(appointment);
																	setDetailsOpen(true);
																}}
															>
																Details & Tool Selection
															</Button>
														</>
													)}

													{appointment.transfer?.newWorker?.id === user?.id && (
														<>
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setSelectedAppointment(appointment);
																	setDetailsOpen(true);
																}}
															>
																Details & Tool Selection
															</Button>
														</>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</Card>

						{/* Pending Confirmations */}
						{pendingAppointments.length > 0 && (
							<Card className="p-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center text-cyan-800 dark:text-cyan-400">
									<AlertCircle className="w-5 h-5 mr-2" />
									Pending ({pendingAppointments.length})
								</h3>
								<div className="space-y-3">
									{pendingAppointments.map((appointment) => (
										<div
											key={appointment.id}
											className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div>
												<p className="font-semibold">
													{appointment.client?.user?.name}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300 ">
													{appointment.service?.name} - {appointment.time}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Date:{" "}
													{appointment.date
														? format(new Date(appointment.date), "PPP", {
																locale: enUS,
															})
														: "Date not set"}
												</p>
											</div>
											<AppointmentCountdown
												date={appointment.date}
												time={appointment.time}
												appointment={appointment}
											/>
										</div>
									))}
								</div>
							</Card>
						)}
						{/* completed Confirmations */}
						{completedAppointments.length > 0 && (
							<Card className="p-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center text-green-800 dark:text-green-400">
									<AlertCircle className="w-5 h-5 mr-2" /> Completed Services (
									{completedAppointments.length})
								</h3>
								<div className="space-y-3">
									{completedAppointments.map((appointment) => (
										<div
											key={appointment.id}
											className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div>
												<p className="font-semibold">
													{appointment.client?.user?.name}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300 ">
													{appointment.service?.name} - {appointment.time}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Date:{" "}
													{appointment.date
														? format(new Date(appointment.date), "PPP", {
																locale: enUS,
															})
														: "Date not set"}
												</p>
											</div>
											<div className="flex gap-2">
												<Button size="sm" variant="secondary">
													Completed
												</Button>
											</div>
										</div>
									))}
								</div>
							</Card>
						)}
						{/* completed Confirmations */}
						{cancelledAppointments.length > 0 && (
							<Card className="p-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center text-red-800 dark:text-red-400">
									<AlertCircle className="w-5 h-5 mr-2" /> Cancelled Services (
									{cancelledAppointments.length})
								</h3>
								<div className="space-y-3">
									{cancelledAppointments.slice(0, 5).map((appointment) => (
										<div
											key={appointment.id}
											className="flex items-center justify-between p-4 border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950"
										>
											<div>
												<p className="font-semibold">
													{appointment.client?.user?.name}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300 ">
													{appointment.service?.name} - {appointment.time}
												</p>
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Date:{" "}
													{appointment.date
														? format(new Date(appointment.date), "PPP", {
																locale: enUS,
															})
														: "Date not set"}
												</p>
											</div>
											<div className="flex gap-2">
												<Button size="sm" disabled variant="destructive">
													Cancelled
												</Button>
											</div>
										</div>
									))}
								</div>
							</Card>
						)}
					</TabsContent>

					{/* Calendar Tab */}
					<TabsContent value="calendar" className="mt-6">
						<BookingCalendar />
					</TabsContent>

					<TabsContent value="tasks" className="mt-6">
						{/* Tasks Management */}
						<div className="py-2">
							<TasksManagement />
						</div>
					</TabsContent>

					<TabsContent value="performance" className="space-y-6">
						{" "}
						{/* Changed value to 'performance' */}
						{isWorkerProfileLoading ||
							isCurrentPeriodCommissionLoading ? (
							<div className="flex justify-center items-center h-64">
								<Loader2 className="h-8 w-8 animate-spin" />
							</div>
						) : workerProfileError ? (
							<Card className="p-6 text-center">
								<AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
								<p className="text-red-500">
									Error loading profile or commission data.
								</p>
							</Card>
						) : (
							<>
								{/* Commission Configuration Status Banner */}
								{isCommissionConfigIncomplete && (
									<Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
										<div className="flex items-start gap-3">
											<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
											<div className="flex-1">
												<h3 className="font-medium text-amber-800 dark:text-amber-200">
													Configuration Required
												</h3>
												<p className="text-lg text-amber-700 dark:text-amber-300 mt-1">
													Your commission settings (frequency, payment day,
													threshold) are not yet configured. This information is
													needed to calculate your payments and generate
													reports.
												</p>

												<StaffModal
													staffId={worker?.id || ""}
													trigger={
														<Button
															variant="outline"
															size="sm"
															className="mt-2 text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
															onClick={handleConfigureCommission}
														>
															<ExternalLink className="h-4 w-4 mr-2" />
															Configure Now
														</Button>
													}
												/>
											</div>
										</div>
									</Card>
								)}

								{/* Summary Cards */}
								<Card className="p-6">
									<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
										<h2 className="text-2xl font-bold">
											My Commissions & Performance
										</h2>
										<div className="flex items-center gap-2">
											<Info className="h-4 w-4 text-gray-500" />
											<span className="text-lg text-gray-600 dark:text-gray-400">
												Next payment: {getNextPaymentDate()}
											</span>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
										<Card className="p-6 border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-sm">
											<div className="flex items-center gap-2 mb-2">
												<DollarSign className="h-5 w-5 text-pink-500" />
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Expected Commission
												</p>
											</div>
											<p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
												{stats.commission
													? stats.commission.toLocaleString()
													: "0"}{" "}
												CDF
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
														Commission Rate is {workerProfile?.commissionRate || 0}%
											</p>
										</Card>

										<Card className="p-6 border border-blue-100 hover:border-blue-400 dark:border-blue-900 dark:hover:border-blue-400 shadow-sm">
											<div className="flex items-center gap-2 mb-2">
												<TrendingUp className="h-5 w-5 text-blue-500" />
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Revenue Generated
												</p>
											</div>
											<p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
												{stats.revenue ? stats.revenue.toLocaleString() : "0"}{" "}
												CDF
											</p>
											<p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
												{currentPeriodCommissionData?.appointmentsCount || 0}{" "}
												appointments
											</p>
										</Card>

										<Card className="p-6 border border-amber-100 hover:border-amber-400 dark:border-amber-900 dark:hover:border-amber-400 shadow-sm">
											<div className="flex items-center gap-2 mb-2">
												<Star className="h-5 w-5 text-amber-500" />
												<p className="text-lg text-gray-600 dark:text-gray-300">
													Average Rating
												</p>
											</div>
											<p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
												{stats.rating.toFixed(1)}
											</p>
											<p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
												Based on {workerProfile?.totalReviews || 0} reviews
											</p>
										</Card>
									</div>
								</Card>

								{/* Performance Chart */}
										{/* <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}`, 'Value']} labelFormatter={(label) => `Day: ${label}`} />
                        <Legend />
                        <Bar dataKey="rendezVous" fill="#a855f7" name="Appointments" />
                        <Bar dataKey="commission" fill="#10b981" name="Commission (CDF)" />
                        <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue (CDF)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
										</Card> */}

								{/* Current Period Summary */}
								<Card className="p-6">
									<h3 className="text-lg font-semibold mb-4">Current Period</h3>

									<Card className="p-4 border border-pink-100 dark:border-pink-900 shadow-sm space-y-4">
										<div className="flex flex-wrap items-center justify-between gap-4">
											<div>
												<p className="font-medium text-gray-900 dark:text-gray-100">
													{freqComm === "daily"
														? "Today"
														: freqComm === "weekly"
															? "This Week"
															: "This Month"}
												</p>

												<p className="text-lg text-gray-600 dark:text-gray-400">
													{currentPeriodCommissionData?.appointmentsCount || 0}{" "}
													appointments completed
												</p>
											</div>

											<div className="text-right">
												<p className="text-xl font-semibold text-green-600 dark:text-green-400">
													{currentPeriodCommissionData?.commission
														? currentPeriodCommissionData.commission.toLocaleString()
														: "0"}{" "}
													CDF
												</p>
											</div>
										</div>

										{/* 🔥 TIMER */}
												<div className="">
													<h2 className="text-lg font-semibold mb-2">🔥 Time Remaining Until Next Payment</h2>
													<PayrollCountdown
														frequency={freqComm as any}
														commissionDay={workerProfile?.commissionDay || 1}
														lastCommissionPaidAt={workerProfile?.lastCommissionPaidAt}
														workerName={workerProfile?.user?.name || "Employee"}
														userId={workerProfile?.user?.id}
													/>
												</div>
									</Card>
								</Card>

								{/* Upcoming Payments Section (only if config is complete) */}
								{workerProfile && !isCommissionConfigIncomplete && (
									<Card className="p-6">
										<h3 className="text-lg font-semibold mb-4">
											Pending Payments
										</h3>
										<Card className="p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
											<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
												<div>
													<p className="font-medium text-gray-900 dark:text-gray-100">
														Next Payment
													</p>
													<p className="text-lg text-gray-600 dark:text-gray-400">
														{getNextPaymentDate()}
													</p>
												</div>
												<div className="text-right">
													<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
														{
															/* Estimate based on current period or average */
															currentPeriodCommissionData?.commission
																? currentPeriodCommissionData.commission.toLocaleString()
																: "0"
														}{" "}
														CDF
													</p>
													<Badge variant="outline" className="text-base">
														Estimated
													</Badge>
												</div>
											</div>
										</Card>
									</Card>
								)}

								{/* Commission History / Earnings Statement */}
								<Card className="p-6">
									<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
										<h3 className="text-lg font-semibold">
											Commission History
										</h3>
										<div className="flex items-center gap-2">
											<Select
												value={selectedPeriod}
												onValueChange={setSelectedPeriod}
														disabled={!workerCommissions || workerCommissions.length === 0}
											>
												<SelectTrigger className="w-45">
													<SelectValue placeholder="Select period" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="daily">
														Daily Commission
													</SelectItem>
													<SelectItem value="weekly">
														Weekly Commission
													</SelectItem>
													<SelectItem value="monthly">
														Monthly Commission
													</SelectItem>
													{/* Add more options based on actual available periods */}
												</SelectContent>
											</Select>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													if (workerCommissions.length === 0) {
														toast("No commissions available", {
															description:
																"There are no commissions to print at the moment.",
														});
													} else printCommissionReportV2();
												}}
											>
												<Download className="h-4 w-4 mr-2" />
												Report
											</Button>
										</div>
									</div>

									{isAllCommissionsLoading ? (
										<div className="flex justify-center py-4">
											<Loader2 className="h-6 w-6 animate-spin" />
										</div>
									) : workerCommissions.length === 0 ? (
										<Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
											<FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
											<p className="text-gray-500">
												No commissions recorded yet.
											</p>
											<p className="text-lg text-gray-500 mt-1">
												Commissions will appear here after you complete
												appointments.
											</p>
										</Card>
									) : (
										<div className="space-y-3 max-h-96 overflow-y-auto pr-2">
											<p>
												Your commission history after each completed service.
												Click the download button to get a detailed report for
												each commission period.
											</p>
											{[...workerCommissions]
												.sort(
													(a, b) =>
														new Date(b.period).getTime() -
														new Date(a.period).getTime(),
												)
												.map((commission) => (
													<Card
														key={commission.id}
														className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
													>
														<div className="flex flex-wrap items-center justify-between gap-4">
															<div>
																<p className="font-medium text-gray-900 dark:text-gray-100">
																	{commission.period}
																</p>
																<p className="text-lg text-gray-600 dark:text-gray-400">
																	{commission.appointmentsCount} apps •{" "}
																	{commission.totalRevenue.toLocaleString()} CDF
																	generated
																</p>
															</div>
															<div className="flex items-center gap-4">
																<div className="text-right">
																	<p
																		className={`text-lg font-semibold ${
																			commission.status === "paid"
																				? "text-green-600 dark:text-green-400"
																				: commission.status === "pending"
																					? "text-amber-600 dark:text-amber-400"
																					: "text-gray-600 dark:text-gray-400"
																		}`}
																	>
																		{commission.commissionAmount.toLocaleString()}{" "}
																		CDF
																	</p>
																	<Badge
																		variant={
																			commission.status === "paid"
																				? "default"
																				: commission.status === "pending"
																					? "outline"
																					: "secondary"
																		}
																	>
																		{commission.status === "paid"
																			? "Paid"
																			: commission.status === "pending"
																				? "Pending"
																				: "Unknown"}
																	</Badge>
																	{commission.status !== "paid" ? <Button
																		variant="ghost"
																		className="ml-2 cursor-pointer"
																		size="sm"
																		onClick={() =>
																			printCommissionReport(commission)
																		}
																	>
																		<Download className="h-4 w-4" />
																	</Button> : null}
																</div>
															</div>
														</div>
													</Card>
												))}
										</div>
									)}
								</Card>
							</>
						)}
					</TabsContent>
				</Tabs>
			</div>

			{/* Appointment Details Dialog */}
			<Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle> Appointment Details</DialogTitle>
					</DialogHeader>

					{selectedAppointment && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									{" "}
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Client
									</label>
									<p className="font-semibold">
										{selectedAppointment.client?.user?.name}
									</p>
								</div>
								<div>
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Service
									</label>
									<p className="font-semibold">
										{selectedAppointment.service?.name}
									</p>
								</div>
								<div>
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Date & Time
									</label>
									<p className="font-semibold">
										{formatDate(selectedAppointment.date)} at{" "}
										{selectedAppointment.time}
									</p>
								</div>
								<div>
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Duration
									</label>
									<p className="font-semibold">
										{selectedAppointment.duration} min
									</p>
								</div>
								<div>
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Location
									</label>
									<p className="font-semibold">
										{selectedAppointment.location === "salon"
											? "At Salon"
											: "At Home"}
									</p>
								</div>
								<div>
									<label className="text-lg text-gray-600 dark:text-gray-300">
										Price
									</label>
									<p className="font-semibold">
										{selectedAppointment.price?.toLocaleString()} CDF
									</p>
								</div>
							</div>

							{selectedAppointment.notes && (
								<div className="p-4 bg-yellow-50 rounded-lg">
									<label className="text-lg text-gray-600 dark:text-gray-300 block mb-1">
										Notes
									</label>
									<p>{selectedAppointment.notes}</p>
								</div>
							)}

							<div className="flex gap-2 pt-4">
								{(selectedAppointment.status === "confirmed" ||
									selectedAppointment.status === "pending") && (
									<>
										<Button
											className="flex-1 bg-purple-600 hover:bg-purple-700"
											onClick={() => {
												// setShowInventorySelection(true);
												handleUpdateStatus(
													selectedAppointment.id,
													"in_progress",
												);
											}}
											disabled={isUpdating}
										>
											<PlayCircle className="w-4 h-4 mr-2" />
											{isUpdating ? "Updating..." : "Start"}
										</Button>
									</>
								)}

								{selectedAppointment.status === "in_progress" && (
									<div className="flex flex-row gap-2 w-full">
										<Button
											className="flex-1 bg-green-600 hover:bg-green-700"
											onClick={() =>
												handleUpdateStatus(selectedAppointment.id, "completed")
											}
											disabled={isUpdating}
										>
											<CheckCheck className="w-4 h-4 mr-2" />
											{isUpdating ? "Updating..." : "Complete"}
										</Button>
										<Button
											variant="outline"
											onClick={() => setShowInventorySelection(true)}
										>
											<ShoppingCart className="w-4 h-4 mr-2" />
											Show inventory to use
										</Button>
									</div>
								)}

								{(selectedAppointment.status === "confirmed" ||
									selectedAppointment.status === "pending") && (
									<Button
										variant="outline"
										className="text-red-600"
										disabled={isUpdating}
										onClick={() =>
											handleUpdateStatus(selectedAppointment.id, "cancelled")
										}
									>
										<XCircle className="w-4 h-4 mr-2" />
										{isUpdating ? "Updating..." : "Cancel"}
									</Button>
								)}
							</div>
							<InventorySelectionModal
								appointmentId={selectedAppointment.id}
								workerId={selectedAppointment.workerId}
								open={showInventorySelection}
								onOpenChange={setShowInventorySelection}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
