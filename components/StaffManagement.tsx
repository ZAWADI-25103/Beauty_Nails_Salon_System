"use client";

import {
	AlertCircle,
	Award,
	Calendar as CalendarIcon,
	CheckCircle,
	Clock,
	DollarSign,
	Download,
	FileText,
	Star,
	TrendingUp,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import CreateWorkerModal from "@/components/modals/CreateWorkerModal";
import type { Worker } from "@/lib/api/staff";
import { useAuth } from "@/lib/hooks/useAuth";
import {
	useAvailableStaff,
	useCommission,
	useStaff,
	useWorker,
} from "@/lib/hooks/useStaff";
import {
	EditScheduleModal,
	PayrollModal,
	StaffProfileModal,
} from "./modals/StaffModals";
import { StaffModal } from "./modals/StaffModals-v2";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function StaffManagement() {
	const [selectedStaff, setSelectedStaff] = useState<Worker | null>(null);
	const [selectedPeriod, setSelectedPeriod] = useState<string>(""); // Changed from selectedMonth, make it a string
	const [isInitializing, setIsInitializing] = useState(false); // State for initialization process
	const { user } = useAuth();

	// API hook
	const { staff, isLoading: staffLoading, refetch } = useStaff();
	const { data: workerProfile, isLoading: profileLoading } = useWorker(
		selectedStaff?.id || "",
	);
	const {
		createCommission,
		isCreating,
		commissions: allCommissions,
	} = useCommission();

	// Generate periods based on worker's frequency
	const generatedPeriods = useMemo(() => {
		if (!workerProfile?.commissionFrequency) return [];
		const now = new Date();
		const periods = [];

		if (workerProfile.commissionFrequency === "daily") {
			for (let i = 0; i < 30; i++) {
				const date = new Date(now);
				date.setDate(date.getDate() - i);
				const periodStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
				periods.push({
					value: periodStr,
					label: date.toLocaleDateString("fr-FR", {
						weekday: "short",
						day: "numeric",
						month: "short",
					}),
				});
			}
		} else if (workerProfile.commissionFrequency === "weekly") {
			for (let i = 0; i < 12; i++) {
				const date = new Date(now);
				date.setDate(date.getDate() - i * 7);
				const day = date.getDay();
				const diff = date.getDate() - day + (day === 0 ? -6 : 1);
				const monday = new Date(date.setDate(diff));
				const periodStr = monday.toISOString().split("T")[0];
				const endOfWeek = new Date(monday);
				endOfWeek.setDate(monday.getDate() + 6);
				periods.push({
					value: periodStr,
					label: `Semaine du ${monday.toLocaleDateString("fr-FR")} au ${endOfWeek.toLocaleDateString("fr-FR")}`,
				});
			}
		} else {
			// monthly
			for (let i = 0; i < 12; i++) {
				const date = new Date(now);
				date.setMonth(date.getMonth() - i);
				const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
				periods.push({
					value: periodStr,
					label: date.toLocaleDateString("fr-FR", {
						month: "long",
						year: "numeric",
					}),
				});
			}
		}
		return periods;
	}, [workerProfile]); // Recalculate when workerProfile changes

	// Determine commission records for the selected staff
	const staffCommissions = useMemo(() => {
		if (!selectedStaff) return { pending: [], paid: [] };
		const filtered = allCommissions.filter(
			(c) => c.workerId === selectedStaff.id,
		);
		return {
			pending: filtered.filter((c) => c.status !== "paid"),
			paid: filtered.filter((c) => c.status === "paid"),
		};
	}, [allCommissions, selectedStaff]);

	const [period, setPeriod] = useState<string>(
		selectedStaff?.commissionFrequency || "daily",
	);

	// Function to check if a period has a commission record
	const hasCommissionRecord = (periodStr: string) => {
		return !!allCommissions.find(
			(c) => c.workerId === selectedStaff?.id && c.period === periodStr,
		);
	};

	// Get commission data for the selected period
	const getCommissionForPeriod = (periodStr: string) =>
		allCommissions.find(
			(c: any) => c.workerId === selectedStaff?.id && c.period === periodStr,
		);

	// Determine if selected period is paid
	const isPeriodPaid = (periodStr: string) => {
		const record = getCommissionForPeriod(periodStr);
		return record?.status === "paid";
	};

	const commissionData = getCommissionForPeriod(selectedPeriod);
	const totalRevenue = commissionData?.totalRevenue || 0;
	const commissionRate =
		commissionData?.commissionRate || workerProfile?.commissionRate || 0;
	const appointmentsCount = commissionData?.appointmentsCount || 0;
	const commissionAmount = totalRevenue * (commissionRate / 100);
	const employerShare = totalRevenue - commissionAmount;

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
		return getPeriodRange(period);
	}, [period]); // Only recalculate when period changes

	// Admin function to initialize a commission record for a period
	const handleInitializeCommission = async () => {
		if (
			!selectedStaff ||
			!selectedPeriod ||
			!workerProfile ||
			hasCommissionRecord(selectedPeriod)
		) {
			return; // Prevent initializing if no staff, no period, no profile, or record already exists
		}

		setIsInitializing(true);
		try {
			// Send minimal data, backend calculates totals from appointments
			createCommission({
				workerId: selectedStaff.id,
				period: selectedPeriod,
				totalRevenue: totalRevenue || 0, // Use fetched/entered value or 0
				appointmentsCount: appointmentsCount || 0, // Use fetched/entered value or 0
				commissionRate: commissionRate,
				// status defaults to 'pending' in backend
			});
			toast.success(`Commission pour ${selectedPeriod} initialisée.`);
			setSelectedPeriod(""); // Reset selection after initialization
		} catch (error) {
			console.error("Erreur d'initialisation de la commission:", error);
			toast.error("Erreur lors de l'initialisation de la commission.");
		} finally {
			setIsInitializing(false);
		}
	};

	const getWorkerCommissions = (id: string) => {
		if (!selectedStaff) return [];
		const workerCommissions =
			allCommissions?.filter((c) => c.workerId === id) || [];
		return workerCommissions;
	};

	const printCommissionReportV2 = () => {
		// No need to pass commissionId - route calculates period automatically
		const params = new URLSearchParams({
			from, // optional: override calculated period
			to, // optional: override calculated period
			pdf: "true", // to get PDF directly
			workerId: selectedStaff?.id || "",
		});

		window.open(
			`/api/commissions/worker-report-v2?${params.toString()}`,
			"_blank",
		);
	};

	const printCommissionReport = (commission: any) => {
		const params = new URLSearchParams({
			commissionId: commission.id,
			from, // optional: override calculated period
			to, // optional: override calculated period
		});

		window.open(
			`/api/commissions/worker-report?${params.toString()}`,
			"_blank",
		);
	};

	// Determine status of the currently selected period
	const selectedPeriodCommission = getCommissionForPeriod(selectedPeriod);
	const selectedPeriodStatus = selectedPeriodCommission?.status || "none"; // 'none', 'pending', 'paid'
	const canInitializeSelectedPeriod =
		selectedPeriod &&
		!hasCommissionRecord(selectedPeriod) &&
		user?.role === "admin";
	const canRequestPaymentSelectedPeriod =
		selectedPeriod &&
		selectedPeriodStatus === "none" &&
		user?.role === "worker"; // Worker requests if no record exists yet
	const canApproveSelectedPeriod =
		selectedPeriod &&
		selectedPeriodStatus === "pending" &&
		user?.role === "admin";

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h2 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100">
					Staff Management
				</h2>
				<CreateWorkerModal triggerLabel="+ New Staff Member" />
			</div>

			{/* Staff Roster - Who's Working Now */}
			<Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
				<h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4">
					Staff Today
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{staff.map((member) => (
						<Card
							key={member.id}
							className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
								member.status === "active"
									? "border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50"
									: member.status === "busy"
										? "border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/50"
										: "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
							}`}
							onClick={() => setSelectedStaff(member)}
						>
							<div className="flex items-center justify-between mb-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-base sm:text-lg">
									{member.name ? member.name.charAt(0) : "E"}
								</div>
								<Badge
									className={`${
										member.status === "active"
											? "bg-green-500"
											: member.status === "busy"
												? "bg-blue-500"
												: "bg-gray-500"
									} text-white text-[10px] sm:text-base`}
								>
									{member.status === "active"
										? "Available"
										: member.status === "busy"
											? "Busy"
											: "Absent"}
								</Badge>
							</div>
							<h4 className="text-gray-900 dark:text-gray-100 mb-1 font-medium">
								{member.name}
							</h4>
							<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
								{member.role}
							</p>
							{member.status === "busy" && (
								<p className="text-[10px] sm:text-base text-blue-600 dark:text-blue-400 mt-2 font-medium">
									Current Client: Marie K.
								</p>
							)}
						</Card>
					))}
				</div>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Staff List */}
				<Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
					<h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4">
						All Staff Members
					</h3>
					<div className="space-y-3">
						{staff.map((member) => (
							<div
								key={member.id}
								onClick={() => setSelectedStaff(member)}
								className={`p-4 rounded-xl cursor-pointer transition-all ${
									selectedStaff?.id === member.id
										? "bg-linear-to-r from-purple-100/50 to-pink-100/50 border-2 border-purple-300 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800"
										: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<p className="text-gray-900 dark:text-gray-100 font-medium">
										{member.name}
									</p>
									<div className="flex items-center gap-1">
										<Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
										<span className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
											{member.rating}
										</span>
									</div>
								</div>
								<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
									{member.role}
								</p>
								<div className="flex items-center justify-between mt-2">
									<span className="text-[10px] sm:text-base text-gray-500 dark:text-gray-500">
										{member.appointmentsCount} appointments
									</span>
									<span className="text-[10px] sm:text-base text-gray-900 dark:text-gray-200 font-medium">
										{member.revenue}
									</span>
								</div>
							</div>
						))}
					</div>
				</Card>

				{/* Staff Details */}
				{selectedStaff ? (
					<Card className="border-0 shadow-lg rounded-2xl p-4 sm:p-8 lg:col-span-2 bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
						<p className=" dark:text-pink-400 text-xs sm:text-xs">
							{"swipe <--- | --->"}
						</p>
						<Tabs defaultValue="performance" className="space-y-6">
							<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
								<TabsTrigger
									value="performance"
									className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
								>
									Performance
								</TabsTrigger>
								<TabsTrigger
									value="commission"
									className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base"
								>
									Commission
								</TabsTrigger>
							</TabsList>

							{/* Performance Tab */}
							<TabsContent value="performance" className="space-y-6">
								<div className="flex flex-col sm:flex-row items-start justify-between gap-4">
									<div>
										<div className="flex flex-row space-x-4">
											<StaffModal
												staffId={selectedStaff?.id || ""}
												trigger={
													<Avatar className="w-16 h-16 mb-4 mr-4 border-4 border-white shadow-lg">
														<AvatarImage src={selectedStaff.avatar || ""} />
														<AvatarFallback className="text-2xl font-medium bg-gray-100 text-gray-600">
															{selectedStaff?.name.split(" ")[0]?.charAt(0) ||
																selectedStaff?.name.charAt(0)}
														</AvatarFallback>
													</Avatar>
												}
											/>
											<h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-2">
												{selectedStaff.name}
											</h3>
										</div>
										<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">
											{selectedStaff.role}
										</p>
										<div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400">
											<p className="flex items-center gap-2">
												<span>📞</span> {selectedStaff.phone}
											</p>
											<p className="flex items-center gap-2">
												<span>📧</span> {selectedStaff.email}
											</p>
											<p className="flex items-center gap-2">
												<span>🕒</span> {selectedStaff.workingHours}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 p-3 sm:p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
										<Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400" />
										<span className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 ">
											{selectedStaff.rating}
										</span>
									</div>
								</div>

								{/* Performance Metrics */}
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
									<Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0 p-3 sm:p-4 shadow-sm">
										<CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mb-2" />
										<p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">
											{selectedStaff.appointmentsCount}
										</p>
										<p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">
											Appointments this month
										</p>
									</Card>
									<Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 p-3 sm:p-4 shadow-sm">
										<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 mb-2" />
										<p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 ">
											{selectedStaff.revenue}
										</p>
										<p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">
											Revenue
										</p>
									</Card>
									<Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 p-3 sm:p-4 shadow-sm">
										<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 mb-2" />
										<p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">
											{selectedStaff.clientRetention}
										</p>
										<p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">
											Retention Rate
										</p>
									</Card>
									<Card className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0 p-3 sm:p-4 shadow-sm">
										<Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 mb-2" />
										<p className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 ">
											{selectedStaff.upsellRate}
										</p>
										<p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">
											Upsell Rate
										</p>
									</Card>
								</div>

								{/* Working Days */}
								<div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
									<h4 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium">
										Working Days
									</h4>
									<div className="flex flex-wrap gap-2">
										{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
											(day) => (
												<Badge
													key={day}
													className={
														selectedStaff.workingDays.includes(day)
															? "bg-purple-500 text-white"
															: "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
													}
												>
													{day}
												</Badge>
											),
										)}
									</div>
								</div>

								<div className="flex gap-3">
									<EditScheduleModal
										staffId={selectedStaff.id}
										staffName={selectedStaff.name}
										trigger={
											<Button className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full">
												Edit Schedule
											</Button>
										}
									/>
								</div>
							</TabsContent>

							{/* Commission Tab */}
							<TabsContent value="commission" className="space-y-6">
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
									<h4 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4 font-medium">
										Calcul Commission & Paie
									</h4>

									<div className="flex item-center gap-2">
										<Select value={period} onValueChange={setPeriod}>
											<SelectTrigger className="w-45">
												<SelectValue placeholder="Select period" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="daily">Daily Commission</SelectItem>
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
											variant="default"
											size="sm"
											onClick={() => {
												if (
													getWorkerCommissions(selectedStaff.id).length === 0
												) {
													toast("No commissions available", {
														description:
															"There are no commissions to print at the moment.",
													});
												} else printCommissionReportV2();
											}}
										>
											<Download className="h-4 w-4 mr-2" />
											Report all
										</Button>
									</div>
								</div>

								{/* Admin Controls for Initialization */}
								{/* {user?.role === "admin" && selectedStaff && (
									<div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
										<h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
											Initialiser Commission (Admin)
										</h5>
										<div className="flex flex-col sm:flex-row gap-3">
											<Select
												value={selectedPeriod}
												onValueChange={setSelectedPeriod}
											>
												<SelectTrigger className="grow">
													<SelectValue placeholder="Sélectionnez une période à initialiser" />
												</SelectTrigger>
												<SelectContent>
													{generatedPeriods
														.filter((gp) => !hasCommissionRecord(gp.value)) // Only show periods without records
														.map((gp) => (
															<SelectItem key={gp.value} value={gp.value}>
																{gp.label}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
											<Button
												onClick={handleInitializeCommission}
												disabled={
													!selectedPeriod ||
													isInitializing ||
													!selectedStaff ||
													!hasCommissionRecord(selectedPeriod)
												}
												className="bg-purple-600 hover:bg-purple-700 text-white"
											>
												{isInitializing ? "Initialisation..." : "Initialiser"}
											</Button>
										</div>
										<p className="text-base text-gray-500 dark:text-gray-400 mt-2">
											This will create a commission record for the selected
											period based on the staff's appointments and revenue.
										</p>
									</div>
								)} */}

								{/* Selected Period Details */}
								{selectedPeriod && (
									<div className="mb-6">
										<h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium">
											Details for period:{" "}
											{generatedPeriods.find(
												(gp) => gp.value === selectedPeriod,
											)?.label || selectedPeriod}
										</h5>

										{selectedPeriodStatus === "none" && (
											<Card className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm">
												<div className="text-center py-4">
													<p className="text-gray-600 dark:text-gray-400">
														No commission record found for this period.
													</p>
													{user?.role === "admin" && (
														<p className="text-sm text-gray-500 mt-2">
															After completing staff's appointments commisions
															will be automatically calculated and appear here.
														</p>
													)}
												</div>
											</Card>
										)}

										{selectedPeriodStatus === "pending" &&
											selectedPeriodCommission && (
												<Card className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
														<div className="flex-1">
															<h6 className="font-medium text-gray-900 dark:text-gray-100">
																Pending / Not Paid
															</h6>
															<div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
																<div className="flex justify-between">
																	<span>Revenue Generated:</span>
																	<span>
																		{selectedPeriodCommission.totalRevenue.toLocaleString()}{" "}
																		CDF
																	</span>
																</div>
																<div className="flex justify-between">
																	<span>Appointments:</span>
																	<span>
																		{selectedPeriodCommission.appointmentsCount}
																	</span>
																</div>
																<div className="flex justify-between">
																	<span>Commission Rate:</span>
																	<span>
																		{selectedPeriodCommission.commissionRate}%
																	</span>
																</div>
															</div>
														</div>
														<div className="flex flex-col items-end gap-2">
															<div className="text-right">
																<p className="text-lg text-gray-600 dark:text-gray-400">
																	Commission
																</p>
																<p className="text-xl font-bold text-green-600 dark:text-green-400">
																	{selectedPeriodCommission.commissionAmount.toLocaleString()}{" "}
																	CDF
																</p>
															</div>
															{user?.role === "admin" && (
																<PayrollModal
																	staffName={selectedStaff.name}
																	staff={selectedStaff}
																	period={selectedPeriodCommission.period}
																commission={selectedPeriodCommission}
																	trigger={
																		<Button
																			size="sm"
																			className="bg-green-600 hover:bg-green-700 text-white"
																		>
																			Approve & Pay
																		</Button>
																	}
																/>
															)}
															{user?.role === "worker" && (
																<p className="text-base text-amber-600 dark:text-amber-400">
																	Awaiting approval
																</p>
															)}
														</div>
													</div>

													{/* Detailed Breakdown */}
													<div className="pt-4 border-t border-amber-200 dark:border-amber-800 text-base text-gray-600 dark:text-gray-400">
														<div className="grid grid-cols-2 gap-2">
															<div>Total Revenue:</div>
															<div className="text-right">
																{selectedPeriodCommission.totalRevenue.toLocaleString()}{" "}
																CDF
															</div>

															<div className="pl-2">
																- Commission (
																{selectedPeriodCommission.commissionRate}%):
															</div>
															<div className="text-right pl-2">
																-
																{selectedPeriodCommission.commissionAmount.toLocaleString()}{" "}
																CDF
															</div>

															<div className="pt-2">
																Business Revenue (Gross):
															</div>
															<div className="text-right pt-2">
																{(
																	selectedPeriodCommission.totalRevenue -
																	selectedPeriodCommission.commissionAmount
																).toLocaleString()}{" "}
																CDF
															</div>

															<div className="pl-2 pt-1">- Materials (5%):</div>
															<div className="text-right pl-2 pt-1">
																{(
																	(selectedPeriodCommission.totalRevenue -
																		selectedPeriodCommission.commissionAmount) *
																	0.05
																).toLocaleString()}{" "}
																CDF
															</div>

															<div className="pl-2">
																- Operating Costs (5%):
															</div>
															<div className="text-right pl-2">
																{(
																	(selectedPeriodCommission.totalRevenue -
																		selectedPeriodCommission.commissionAmount) *
																	0.05
																).toLocaleString()}{" "}
																CDF
															</div>

															<div className="pt-2 font-medium">
																Business Revenue (Net):
															</div>
															<div className="text-right pt-2 font-medium">
																{(
																	selectedPeriodCommission.totalRevenue -
																	selectedPeriodCommission.commissionAmount -
																	(selectedPeriodCommission.totalRevenue -
																		selectedPeriodCommission.commissionAmount) *
																		0.1
																).toLocaleString()}{" "}
																CDF
															</div>
														</div>
													</div>
												</Card>
											)}

										{selectedPeriodStatus === "paid" &&
											selectedPeriodCommission && (
												<Card className="bg-green-50 dark:bg-green-900/10 border-0 p-5 shadow-sm">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
														<div className="flex-1">
															<h6 className="font-medium text-gray-900 dark:text-gray-100">
																Paid
															</h6>
															<div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
																<div className="flex justify-between">
																	<span>Paid on:</span>
																	<span>
																		{selectedPeriodCommission.paidAt
																			? new Date(
																					selectedPeriodCommission.paidAt,
																				).toLocaleDateString("en-US")
																			: "N/A"}
																	</span>
																</div>
																<div className="flex justify-between">
																	<span>Revenue Generated:</span>
																	<span>
																		{selectedPeriodCommission.totalRevenue.toLocaleString()}{" "}
																		CDF
																	</span>
																</div>
																<div className="flex justify-between">
																	<span>Commission Paid:</span>
																	<span className="text-green-600 dark:text-green-400">
																		{selectedPeriodCommission.commissionAmount.toLocaleString()}{" "}
																		CDF
																	</span>
																</div>
															</div>
														</div>
														<div className="flex flex-col items-end gap-2">
															<div className="text-right">
																<p className="text-lg text-gray-600 dark:text-gray-400">
																	Status
																</p>
																<p className="text-xl font-bold text-green-600 dark:text-green-400">
																	Paid
																</p>
															</div>
														</div>
													</div>
												</Card>
											)}
									</div>
								)}

								{/* All Commissions List */}
								{(staffCommissions.pending.length > 0 ||
									staffCommissions.paid.length > 0) && (
									<div className="space-y-6">
										{/* Pending Commissions */}
										{staffCommissions.pending.length > 0 && (
											<div>
												<h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-amber-500"></span>
													Pending Commissions ({staffCommissions.pending.length}
													)
												</h5>
												<div className="space-y-4">
													{staffCommissions.pending.map((commission: any) => (
														<Card
															key={commission.id}
															className="bg-amber-50 dark:bg-amber-900/10 border-0 p-5 shadow-sm"
														>
															<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
																<div className="flex-1">
																	<h6 className="font-medium text-gray-900 dark:text-gray-100">
																		{commission.period}
																	</h6>
																	<div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
																		<div className="flex justify-between">
																			<span>Revenue Generated:</span>
																			<span>
																				{commission.totalRevenue.toLocaleString()}{" "}
																				CDF
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span>Appointments:</span>
																			<span>
																				{commission.appointmentsCount}
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span>Commission Rate:</span>
																			<span>{commission.commissionRate}%</span>
																		</div>
																	</div>
																</div>
																<div className="flex flex-col items-end gap-2">
																	<div className="text-right">
																		<p className="text-lg text-gray-600 dark:text-gray-400">
																			Commission
																		</p>
																		<p className="text-xl font-bold text-green-600 dark:text-green-400">
																			{commission.commissionAmount.toLocaleString()}{" "}
																			CDF
																		</p>
																	</div>
																	{user?.role === "admin" && (
																		<PayrollModal
																			staffName={selectedStaff.name}
																			staff={selectedStaff}
																			period={commission.period}
																			trigger={
																				<Button
																					size="sm"
																					className="bg-green-600 hover:bg-green-700 text-white"
																				>
																					Approve & Pay
																				</Button>
																			}
																		/>
																	)}
																</div>
															</div>
														</Card>
													))}
												</div>
											</div>
										)}

										{/* Paid Commissions */}
										{staffCommissions.paid.length > 0 && (
											<div>
												<div className="flex flex-row items-center gap-2">
													<h5 className="text-lg sm:text-base text-gray-900 dark:text-gray-100 mb-3 font-medium flex items-center gap-2">
														<span className="w-2 h-2 rounded-full bg-green-500"></span>
														Paid Commissions ({staffCommissions.paid.length})
													</h5>
												</div>
												<div className="space-y-4">
													{staffCommissions.paid.map((commission: any) => (
														<Card
															key={commission.id}
															className="bg-green-50 dark:bg-green-900/10 border-0 p-5 shadow-sm"
														>
															<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
																<div className="flex-1">
																	<h6 className="font-medium text-gray-900 dark:text-gray-100">
																		{commission.period}
																	</h6>
																	<div className="space-y-1 text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
																		<div className="flex justify-between">
																			<span>Paid on:</span>
																			<span>
																				{commission.paidAt
																					? new Date(
																							commission.paidAt,
																						).toLocaleDateString("en-US")
																					: "N/A"}
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span>Revenue Generated:</span>
																			<span>
																				{commission.totalRevenue.toLocaleString()}{" "}
																				CDF
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span>Commission Paid:</span>
																			<span className="text-green-600 dark:text-green-400">
																				{commission.commissionAmount.toLocaleString()}{" "}
																				CDF
																			</span>
																		</div>
																		<Button
																			variant="default"
																			className="mt-2 cursor-pointer"
																			size="sm"
																			onClick={() =>
																				printCommissionReport(commission)
																			}
																		>
																			Generate Commission Report
																			<Download className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
																<div className="flex flex-col items-end gap-2">
																	<div className="text-right">
																		<p className="text-lg text-gray-600 dark:text-gray-400">
																			Status
																		</p>
																		<p className="text-xl font-bold text-green-600 dark:text-green-400">
																			Paid
																		</p>
																	</div>
																</div>
															</div>
														</Card>
													))}
												</div>
											</div>
										)}
									</div>
								)}

								{/* No commissions yet */}
								{staffCommissions.pending.length === 0 &&
									staffCommissions.paid.length === 0 &&
									!profileLoading &&
									selectedStaff &&
									!selectedPeriodCommission && (
										<Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
											<FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
											<p className="text-gray-500">
												No commission records found for {selectedStaff.name}{" "}
												yet.
											</p>
											{user?.role === "admin" && (
												<p className="text-sm text-gray-500 mt-2">
													Use the Initialize Commission section above to get
													started.
												</p>
											)}
										</Card>
									)}
							</TabsContent>
						</Tabs>
					</Card>
				) : (
					<Card className="border-0 shadow-lg rounded-2xl p-8 lg:col-span-2 flex items-center justify-center bg-white dark:bg-gray-950 dark:border dark:border-pink-900/30">
						<div className="text-center text-gray-500 dark:text-gray-400">
							<Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
							<p className="text-base sm:text-lg font-medium">
								Select a staff member to view their details
							</p>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
