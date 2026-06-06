import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Award,
	Calendar,
	CalendarIcon,
	DollarSign,
	Download,
	FileText,
	Loader2,
	Mail,
	Phone,
	Save,
	Star,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Worker } from "@/lib/api/staff";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCommission, useStaff, useWorker, useWorkerSchedule } from "@/lib/hooks/useStaff";
import { PayrollCountdown } from "../PayrollCountdown";

// --- Edit Schedule Modal (Mobile Optimized with Dark Mode) ---
interface EditScheduleModalProps {
	staffId: string;
	staffName?: string;
	trigger?: React.ReactNode;
}

type DaySchedule = {
	startTime: string;
	endTime: string;
	isAvailable: boolean;
};

export function EditScheduleModal({
	staffId,
	staffName,
	trigger,
}: EditScheduleModalProps) {
	const { updateSchedule, schedule, isUpdating } = useWorkerSchedule(staffId);
	const [weekSchedule, setWeekSchedule] = useState<Record<number, DaySchedule>>(
		{},
	);
	const [savingDays, setSavingDays] = useState<Record<number, boolean>>({});
	const { refetch } = useStaff();
	const daysOfWeek = [
		{ idx: 0, day: "Sunday" },
		{ idx: 1, day: "Monday" },
		{ idx: 2, day: "Tuesday" },
		{ idx: 3, day: "Wednesday" },
		{ idx: 4, day: "Thursday" },
		{ idx: 5, day: "Friday" },
		{ idx: 6, day: "Saturday" },
	];

	useEffect(() => {
		if (!schedule || Object.keys(weekSchedule).length > 0) return;
		const map: Record<number, DaySchedule> = {};

		schedule.forEach((s: any) => {
			map[s.dayOfWeek] = {
				startTime: s.startTime,
				endTime: s.endTime,
				isAvailable: s.isAvailable,
			};
		});

		daysOfWeek.forEach((d) => {
			if (!map[d.idx]) {
				map[d.idx] = {
					startTime: "09:00",
					endTime: "18:00",
					isAvailable: d.idx !== 6,
				};
			}
		});

		setWeekSchedule((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(map)) {
				return prev;
			}
			return map;
		});
	}, [schedule]);

	const updateDay = (day: number, changes: Partial<DaySchedule>) => {
		setWeekSchedule((prev) => ({
			...prev,
			[day]: {
				...prev[day],
				...changes,
			},
		}));
	};

	const saveDay = async (day: number, override?: DaySchedule) => {
		const d = override ?? weekSchedule[day];
		if (!d) return;
		try {
			setSavingDays((prev) => ({ ...prev, [day]: true }));

			await updateSchedule({
				dayOfWeek: day,
				startTime: d.startTime,
				endTime: d.endTime,
				isAvailable: d.isAvailable,
			});
		} finally {
			setSavingDays((prev) => ({ ...prev, [day]: false }));
		}
	};

	const saveAll = async () => {
		for (const day of Object.keys(weekSchedule)) {
			await saveDay(Number(day));
		}

		refetch();
	};

	return (
		<Dialog>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-180 max-h-[85vh] overflow-y-auto dark:bg-gray-900">
				<DialogHeader>
					<DialogTitle className="flex justify-between items-center">
						<span className="text-gray-900 dark:text-gray-100">
							Edit Schedule - {staffName || "Staff"}
						</span>
					</DialogTitle>
				</DialogHeader>

				<div className="py-4 space-y-4">
					<div className="grid grid-cols-1 gap-2">
						<div className="grid grid-cols-12 gap-2 text-lg font-medium text-muted-foreground mb-2 px-3 dark:text-gray-300">
							<div className="col-span-3">Day</div>
							<div className="col-span-4">Start</div>
							<div className="col-span-4">End</div>
							<div className="col-span-1 text-center">Active</div>
						</div>

						{daysOfWeek.map((day) => {
							const row = weekSchedule[day.idx];
							const saving = savingDays[day.idx];

							return (
								<div
									key={day.idx}
									className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
								>
									<div className="col-span-3 font-medium text-gray-900 dark:text-gray-100">
										{day.day}
									</div>

									<div className="col-span-4">
										<Input
											type="time"
											value={row?.startTime || "09:00"}
											disabled={!row?.isAvailable}
											onChange={(e) =>
												updateDay(day.idx, { startTime: e.target.value })
											}
											onBlur={() => saveDay(day.idx)}
											className="h-8 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400"
										/>
									</div>

									<div className="col-span-4">
										<Input
											type="time"
											value={row?.endTime || "18:00"}
											disabled={!row?.isAvailable}
											onChange={(e) =>
												updateDay(day.idx, { endTime: e.target.value })
											}
											onBlur={() => saveDay(day.idx)}
											className="h-8 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400"
										/>
									</div>

									<div className="col-span-1 flex justify-center">
										{saving ? (
											<Loader2 className="w-4 h-4 animate-spin text-muted-foreground dark:text-gray-400" />
										) : (
											<Checkbox
												id={`day-${day.idx}`}
												checked={row?.isAvailable ?? true}
												onCheckedChange={(checked) => {
													const value = checked === true;

													const updated = {
														...weekSchedule[day.idx],
														isAvailable: value,
													};

													updateDay(day.idx, { isAvailable: value });
													saveDay(day.idx, updated);
												}}
												className="scale-110 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-600 dark:data-[state=checked]:border-pink-600"
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						Cancel
					</Button>

					<Button
						onClick={saveAll}
						disabled={isUpdating}
						className="bg-purple-600 hover:bg-purple-700 text-white gap-2 dark:bg-purple-700 dark:hover:bg-purple-800"
					>
						{isUpdating ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<>
								<Save className="w-4 h-4" />
								Save Schedule
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// --- Staff Profile Modal (Mobile Optimized with Enhanced Dark Mode) ---
interface StaffProfileModalProps {
	staff?: Worker;
	trigger?: React.ReactNode;
}

export function StaffProfileModal({ staff, trigger }: StaffProfileModalProps) {
	const [selectedMonth, setSelectedMonth] = useState("2026-02");
	const allMonths = [
		{ value: "2026-01", label: "January 2026" },
		{ value: "2026-02", label: "February 2026" },
		{ value: "2026-03", label: "March 2026" },
		{ value: "2026-04", label: "April 2026" },
		{ value: "2026-05", label: "May 2026" },
		{ value: "2026-06", label: "June 2026" },
		{ value: "2026-07", label: "July 2026" },
		{ value: "2026-08", label: "August 2026" },
		{ value: "2026-09", label: "September 2026" },
		{ value: "2026-10", label: "October 2026" },
		{ value: "2026-11", label: "November 2026" },
		{ value: "2026-12", label: "December 2026" },
	];

	const { commissions } = useCommission();
	const getCommissionForMonth = (month: string) =>
		commissions.find((c) => c.workerId === staff?.id && c.period === month);

	const isMonthPaid = (month: string) =>
		getCommissionForMonth(month)?.status === "paid";

	const totalRevenue =
		getCommissionForMonth(selectedMonth || "")?.totalRevenue || 0;
	const commissionRate =
		getCommissionForMonth(selectedMonth || "")?.commissionRate || 0;
	const commissionAmount =
		getCommissionForMonth(selectedMonth || "")?.commissionAmount || 0;
	const employerShare = totalRevenue - commissionAmount;
	const materielShare = employerShare * 0.05;
	const operationalCosts = employerShare * 0.05;

	return (
		<Dialog>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 dark:bg-gray-900">
				<DialogHeader>
					<DialogTitle className="sr-only">Staff Profile</DialogTitle>
				</DialogHeader>

				<div className="px-2 pb-4">
					<div className="flex flex-col gap-6">
						{/* Profile Info - Mobile Optimized */}
						<div className="w-full text-center space-y-4">
							<div className="flex justify-center">
								<Avatar className="w-28 h-28 border-4 border-white shadow-lg dark:border-gray-800">
									<AvatarImage src={staff?.avatar || ""} />
									<AvatarFallback className="text-3xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
										{staff?.name.split(" ")[0]?.charAt(0) ||
											staff?.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
							</div>

							<div>
								<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
									{staff?.name}
								</h3>
								<p className="text-pink-600 dark:text-pink-400 font-medium">
									Employee
								</p>
							</div>

							<Badge
								className={
									staff?.isAvailable
										? "bg-green-500"
										: "bg-gray-400 dark:bg-gray-700"
								}
							>
								{staff?.isAvailable ? "Active Employee" : "Inactive"}
							</Badge>

							<div className="w-full space-y-3 text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
								<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
									<Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
									{staff?.phone}
								</div>
								<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
									<Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
									{staff?.email}
								</div>
								<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
									<Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
									Hired:{" "}
									{staff?.hireDate
										? staff?.hireDate
												.split("T")[0]
												.split("-")
												.reverse()
												.join("/")
										: "N/A"}
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-left block font-semibold text-gray-900 dark:text-gray-100">
									Biography
								</Label>
								<p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-left">
									Nail care specialist with over 5 years of experience.
									Expert in Nail Art and hand care. Appreciated for her
									gentleness and creativity. Fluent in French and Lingala.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-left block font-semibold text-gray-900 dark:text-gray-100">
									Skills
								</Label>
								<div className="flex flex-wrap justify-center gap-2">
									{
										[
											"Manicure",
											"Pedicure",
											"Nail Art",
											"Gel",
											"Acrylic",
											"Hand Massage",
										].map((skill) => (
											<Badge
												key={skill}
												variant="secondary"
												className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
											>
												{skill}
											</Badge>
										))
									}
								</div>
							</div>
						</div>

						{/* Main Content Tabs */}
						<div className="w-full pt-2">
							<p className=" dark:text-pink-400 text-xs sm:text-xs">
								{"swipe  <--- | --->"}
							</p>
							<Tabs defaultValue="performance" className="w-full">
								<TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
									<TabsTrigger
										value="performance"
										className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
									>
										Performance
									</TabsTrigger>
									<TabsTrigger
										value="commission"
										className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
									>
										Commission
									</TabsTrigger>
									<TabsTrigger
										value="documents"
										className="rounded-lg px-4 py-2 mb-2 sm:mb-0 sm:mr-2 text-lg data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400"
									>
										Documents
									</TabsTrigger>
								</TabsList>

								{/* Performance Tab - Mobile Optimized */}
								<TabsContent value="performance" className="space-y-4 mt-4">
									<div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
										<div className="text-center">
											<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
												{staff?.name}
											</h3>
											<p className="text-gray-600 dark:text-gray-400 mt-1">
												{staff?.role}
											</p>
										</div>
										<div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30">
											<Star className="w-5 h-5 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500" />
											<span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
												{staff?.rating}
											</span>
										</div>
									</div>

									{/* Performance Metrics */}
									<div className="grid grid-cols-2 gap-3">
										<Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
											<CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
											<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
												{staff?.appointmentsCount}
											</p>
											<p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">
												Appointments this month
											</p>
										</Card>
										<Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
											<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
											<p className="text-lg font-bold text-gray-900 dark:text-gray-100">
												{staff?.revenue}
											</p>
											<p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">
												Revenue
											</p>
										</Card>
										<Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
											<TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
											<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
												{staff?.clientRetention}
											</p>
											<p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">
												Retention
											</p>
										</Card>
										<Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-3">
											<Award className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
											<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
												{staff?.upsellRate}
											</p>
											<p className="text-base text-gray-600 dark:text-gray-400 uppercase tracking-wider">
												Upsell Rate
											</p>
										</Card>
									</div>

									<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
										<h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
											Working Days
										</h4>
										<div className="flex flex-wrap gap-2 justify-center">
											{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
												(day, index) => (
													<Badge
														key={day}
														className={
															staff?.schedules?.some(
																(s: any) =>
																	s.dayOfWeek === index && s.isAvailable,
															)
																? "bg-purple-500 text-white"
																: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
														}
													>
														{day}
													</Badge>
												),
											)}
										</div>
									</div>

									<EditScheduleModal
										staffId={staff?.id || ""}
										staffName={staff?.name}
										trigger={
											<Button className="w-full bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
												Edit Hours
											</Button>
										}
									/>
								</TabsContent>

								{/* Commission Tab */}
								<TabsContent value="commission" className="space-y-4 mt-4">
									<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
										Commission & Payroll Calculation
									</h4>
									<div className="space-y-4">
										<Select
											value={selectedMonth}
											onValueChange={setSelectedMonth}
										>
											<SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="dark:bg-gray-800 dark:border-gray-700">
												{allMonths.map((m) => (
													<SelectItem
														key={m.value}
														value={m.value}
														disabled={isMonthPaid(m.value)}
														className="dark:hover:bg-gray-700 dark:focus:bg-gray-700"
													>
														{m.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{selectedMonth && getCommissionForMonth(selectedMonth) && (
											<Card className="hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 p-4">
												<h5 className="text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
													<span className="w-2 h-2 rounded-full bg-green-500"></span>
													This Month (
													{
														allMonths.find((m) => m.value === selectedMonth)
															?.label
													}{" "}
													-{" "}
													{getCommissionForMonth(selectedMonth)?.status ===
													"paid"
														? "Paid"
														: "Pending"}
													)
												</h5>
												<div className="space-y-3">
													<div className="flex justify-between items-center">
														<span className="text-lg text-gray-700 dark:text-gray-300">
															Generated Revenue
														</span>
														<span className="font-medium text-gray-900 dark:text-gray-100">
															{totalRevenue.toLocaleString()}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-lg text-gray-700 dark:text-gray-300">
															Commission Rate
														</span>
														<span className="font-medium text-gray-900 dark:text-gray-100">
															{commissionRate.toLocaleString()}%
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-lg text-gray-700 dark:text-gray-300">
															Business Revenue
														</span>
														<span className="font-medium text-gray-900 dark:text-gray-100">
															{employerShare}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-lg text-gray-700 dark:text-gray-300">
															Materials Reserve
														</span>
														<span className="font-medium text-gray-900 dark:text-gray-100">
															{materielShare}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-lg text-gray-700 dark:text-gray-300">
															Operational Costs
														</span>
														<span className="font-medium text-gray-900 dark:text-gray-100">
															{operationalCosts}
														</span>
													</div>

													<Separator className="my-3 dark:bg-gray-700" />

													<div className="flex justify-between items-center pt-2">
														<span className="font-medium text-gray-900 dark:text-gray-100">
															Total Commission
														</span>
														<span className="text-xl text-green-600 dark:text-green-400 font-bold">
															{commissionAmount.toLocaleString()}
														</span>
													</div>
												</div>
											</Card>
										)}

										{!isMonthPaid(selectedMonth) && (
											<PayrollModal
												staffName={staff?.name}
												staff={staff}
												period={selectedMonth}
												trigger={
													<Button
														size="default"
														className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
													>
														Generate Payslip
													</Button>
												}
											/>
										)}
									</div>
								</TabsContent>

								{/* Documents Tab */}
								<TabsContent value="documents" className="mt-4">
									<div className="space-y-3">
										{
											[
												"Employment Contract.pdf",
												"ID Document.jpg",
												"Certificates.pdf",
											].map((doc, i) => (
												<div
													key={i}
													className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 dark:border-gray-700 cursor-pointer transition-colors group"
												>
													<div className="flex items-center gap-3 mb-2 sm:mb-0">
														<div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-500 dark:text-pink-400">
															<FileText className="w-5 h-5" />
														</div>
														<div>
															<p className="font-medium text-gray-900 dark:text-gray-100">
																{doc}
															</p>
															<p className="text-base text-gray-500 dark:text-gray-400">
																Added on Jan 12, 2023
															</p>
														</div>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="text-gray-400 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400"
													>
														<Download className="w-4 h-4" />
													</Button>
												</div>
											))
										}
									</div>
									<Button
										variant="outline"
										className="w-full mt-4 border-dashed py-6 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-400"
									>
										+ Add Document
									</Button>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// --- Payroll Modal (Mobile Optimized with Dark Mode) ---

interface PayrollModalProps {
	staffName?: string;
	staff?: Worker;
	period?: string;
	commission?: any;
	trigger?: React.ReactNode;
}

export const getNextResetDate = (period: string) => {
	const now = new Date();
	const next = new Date();

	if (period === "daily") {
		next.setDate(now.getDate() + 1);
		next.setHours(0, 0, 0, 0);
	}

	if (period === "weekly") {
		const day = now.getDay();
		const diff = (7 - day + 1) % 7 || 7;
		next.setDate(now.getDate() + diff);
		next.setHours(0, 0, 0, 0);
	}

	if (period === "monthly") {
		next.setMonth(now.getMonth() + 1);
		next.setDate(1);
		next.setHours(0, 0, 0, 0);
	}

	return next;
};

export function PayrollModal({
	staffName,
	staff,
	period,
	commission,
	trigger,
}: PayrollModalProps) {
	const { user } = useAuth(); // or however you get current user
	const isAdmin = user?.role === "admin";
	const {
		createCommission,
		isCreating,
		updateCommission,
		commissions,
		isUpdating,
		refetch,
	} = useCommission();

	const { data: workerProfile } = useWorker(staff?.id || ""); // Fetch worker profile to get frequency
	const [isPaymentAvailable, setIsPaymentAvailable] = useState(false);

	const [localPeriod, setLocalPeriod] = useState("");
	const [sendEmailToWorker, setSendEmailToWorker] = useState(true);

	// console.log("Worker Profile:", { period: workerProfile?.commissionFrequency, day: workerProfile?.commissionDay });

	const payoutCommissionRecord =
		commission ??
		commissions.find(
			(c: any) =>
				c.workerId === staff?.id &&
				c.period === period &&
				c.commissionInitializedAtAppointmentCompletion === false,
		);

	useEffect(() => {
		if (payoutCommissionRecord?.period) {
			setLocalPeriod(payoutCommissionRecord.period);
		}
	}, [payoutCommissionRecord?.period]);

	const isLockedByTime = !isPaymentAvailable;

	// Get commission data for the selected period
	const getPayoutCommissionForPeriod = (periodStr: string) =>
		payoutCommissionRecord ??
		commissions.find(
			(c: any) =>
				c.workerId === staff?.id &&
				c.period === periodStr &&
				c.commissionInitializedAtAppointmentCompletion === false,
		);

	const isPeriodPaid = (periodStr: string) =>
		getPayoutCommissionForPeriod(periodStr)?.status === "paid";

	const activePeriod =
		localPeriod || payoutCommissionRecord?.period || period || "";

	const payoutCommissionExists =
		!!getPayoutCommissionForPeriod(activePeriod);

	const payoutCommissionData = getPayoutCommissionForPeriod(activePeriod);

	// if (!payoutCommissionData && !payoutCommissionRecord) {
	// 	return (
	// 		<div className="flex justify-center items-center h-64">
	// 			<Loader2 className="h-8 w-8 animate-spin" />
	// 		</div>
	// 	);
	// }

	let totalRevenue = 0;
	let commissionRate = 0;
	let appointmentsCount = 0;
	let commissionAmount = 0;
	let employerShare = 0;

	if (isAdmin) {
		totalRevenue = payoutCommissionData?.totalRevenue || 0;
		commissionRate =
			payoutCommissionData?.commissionRate || workerProfile?.commissionRate || 0;
		appointmentsCount = payoutCommissionData?.appointmentsCount || 0;
		commissionAmount = payoutCommissionData?.commissionAmount || 0;
		employerShare = payoutCommissionData?.businessEarnings || 0;
	} else {
		totalRevenue = payoutCommissionData?.totalRevenue || 0;
		commissionRate =
			payoutCommissionData?.commissionRate || workerProfile?.commissionRate || 0;
		appointmentsCount = payoutCommissionData?.appointmentsCount || 0;
		commissionAmount = payoutCommissionData?.commissionAmount || 0;
		employerShare = payoutCommissionData?.businessEarnings || 0;
	}

	const handleGenerateOrRequest = () => {
		if (!staff || !localPeriod) {
			toast.error("Select a valid period to generate or request payment.");
			return;
		}

		if (isPeriodPaid(localPeriod)) {
			toast.info("This period has already been paid.");
			return;
		}

		if (payoutCommissionExists) {
			// If record exists but is not paid, worker is requesting approval
			if (!isAdmin) {
				toast.info(
					"Payment request already exists for this period. Awaiting admin approval.",
				);
				// Optionally, trigger an update mutation to set status to 'pending' if it wasn't already
				// This depends on your backend logic for handling requests.
				// Example: updateCommission({ id: commissionData.id, status: 'pending' });
			} else {
				toast.info("A record already exists for this period.");
			}
			return;
		}

		// Only create a new record if it doesn't exist yet
		// Admin can always create/overwrite. Worker can only request if not already created.
		if (isAdmin) {
			// We'll pass the current displayed values. 
			createCommission({
				workerId: staff.id,
				period: localPeriod,
				totalRevenue: totalRevenue || 0, // Use fetched/entered value or 0
				appointmentsCount: appointmentsCount || 0, // Use fetched/entered value or 0
				commissionRate: commissionRate,
				// status defaults to 'pending' in backend
			});
			refetch();
		} else {
			// Backend logic might differ.
			createCommission({
				workerId: staff.id,
				period: localPeriod,
				totalRevenue: totalRevenue || 0, // Value might come from backend calc
				appointmentsCount: appointmentsCount || 0, // Value might come from backend calc
				commissionRate: commissionRate,
				// status defaults to 'pending' in backend, which is appropriate for a request
			});
			refetch();
		}
	};

	const handleApprove = () => {
		const commissionToPay = getPayoutCommissionForPeriod(activePeriod);
		if (!commissionToPay?.id) {
			toast.error(
				"No commission record found for this period.",
			);
			return;
		}
		// Admin approves by changing status to 'paid'
		updateCommission({
			id: commissionToPay.id,
			status: "paid",
			sendEmail: sendEmailToWorker,
		});
		refetch();
	};

	// Determine button states based on user role, period status, and record existence
	const isPaid = isPeriodPaid(activePeriod);
	const isPending =
		getPayoutCommissionForPeriod(activePeriod)?.status === "pending";
	const isRequested = isPending && !isAdmin; // Worker sees 'requested' as 'pending'
	const canAdminApprove = isAdmin && isPending && activePeriod;

	// Determine button text and state
	let buttonText = "Générer Demande";
	let buttonVariant:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link"
		| null
		| undefined = "default";
	let buttonDisabled = !activePeriod || isPaid;

	if (isAdmin) {
		if (canAdminApprove) {
			buttonText = isUpdating ? "Paying..." : "Approve Payment";
			buttonVariant = "default"; // Purple
		} else if (isPaid) {
			buttonText = "Paid";
			buttonVariant = "outline";
			buttonDisabled = true;
		} else if (payoutCommissionExists) {
			buttonText = "Paid (pending approval)";
			buttonVariant = "outline";
			buttonDisabled = true; // Admin cannot re-request, only approve
		} else {
			buttonText = isCreating ? "Creating..." : "Create & Request Payment";
			buttonVariant = "default";
		}
	} else {
		// Worker
		if (isPaid) {
			buttonText = "Paid";
			buttonVariant = "outline";
			buttonDisabled = true;
		} else if (isRequested) {
			buttonText = "Request Submitted";
			buttonVariant = "outline";
			buttonDisabled = true;
		} else if (payoutCommissionExists) {
			// Record exists but is not paid or requested yet (maybe created by admin but not approved)
			buttonText = "Request Submitted";
			buttonVariant = "outline";
			buttonDisabled = true;
		} else {
			buttonText = isCreating ? "Sending..." : "Request Payment";
			buttonVariant = "default"; // Green
		}
	}

	return (
		<Dialog>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-4 dark:bg-gray-900">
				<DialogHeader>
					<DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
						Generate Pay Slip
					</DialogTitle>
				</DialogHeader>

				<div className="py-4 space-y-4">
					<div className="grid grid-cols-1 gap-3">
						<div className="space-y-2">
							<Label className="text-lg text-gray-700 dark:text-gray-300">
								Employee
							</Label>
							<Input
								value={staffName || staff?.user?.name || "Employee"}
								disabled
								className="bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 h-11 text-base"
							/>
						</div>

						<div className="space-y-2">
							{!isAdmin && (
								<Label className="text-lg justify-between text-gray-700 dark:text-gray-300">
									(
									{period === "daily"
										? "Today"
										: period === "weekly"
											? "This week"
											: "This month"}
									)
									{
										<Input
											type="text"
											value={`${format(getNextResetDate(period || ""),
												"yyyy-MM-dd  HH:mm",
												{ locale: enUS })}`}
											// onChange={(e) => setLocalTotalRevenue(parseFloat(e.target.value) || 0)} // Disable editing in this view
											className="w-56 text-right h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
											disabled // Values are calculated/fetched, not edited here
										/>
									}
								</Label>
							)}
							{isAdmin && (
								<div className="space-y-2">
									<Label className="text-lg text-gray-700 dark:text-gray-300">
										Period
									</Label>
									<Input
										value={payoutCommissionRecord?.period || period || ""}
										disabled
										className="bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 h-11 text-base"
									/>
								</div>
							)}
						</div>
					</div>

					<Separator className="dark:bg-gray-700" />
					<div className="space-y-3">
						<PayrollCountdown
							frequency={period as any}
							commissionDay={workerProfile?.commissionDay || 1}
							onReadyChange={setIsPaymentAvailable}
						/>
					</div>
					<Separator className="dark:bg-gray-700" />

					<div className="space-y-3">
						<h4 className="font-bold text-gray-900 dark:text-gray-100">
							Calculation Details
						</h4>

						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<Label className="text-gray-600 dark:text-gray-400 text-lg">
									Generated Revenue
								</Label>
								<div className="flex items-center">
									<span className="text-lg text-gray-500 dark:text-gray-400 mr-1">
										CDF
									</span>
									<Input
										type="number"
										value={totalRevenue}
										// onChange={(e) => setLocalTotalRevenue(parseFloat(e.target.value) || 0)} // Disable editing in this view
										className="text-right w-32 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
										disabled // Values are calculated/fetched, not edited here
									/>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<Label className="text-gray-600 dark:text-gray-400 text-lg">
									Number of Appointments
								</Label>
								<Input
									type="number"
									value={appointmentsCount}
									// onChange={(e) => setLocalAppointmentsCount(parseInt(e.target.value) || 0)} // Disable editing
									className="text-right w-32 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
									disabled // Values are calculated/fetched
								/>
							</div>

							<div className="flex justify-between items-center">
								<Label className="text-gray-600 dark:text-gray-400 text-lg">
									Commission Rate
								</Label>
								<div className="flex items-center">
									<Input
										type="number"
										value={commissionRate}
										className="text-right w-24 h-10 text-base bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
										disabled
									/>
									<span className="ml-1 text-gray-500 dark:text-gray-400">
										%
									</span>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<Label className="text-gray-600 dark:text-gray-400 text-lg">
									Commission (Calculated)
								</Label>
								<div className="flex items-center">
									<span className="text-lg text-gray-500 dark:text-gray-400 mr-1">
										CDF
									</span>
									<Input
										value={commissionAmount.toFixed(2)}
										disabled
										className="text-right w-32 h-10 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
									/>
								</div>
							</div>

							{isAdmin && (
								<div className="flex justify-between items-center">
									<Label className="text-blue-600 dark:text-blue-400 text-lg">
										Administrator's Share
									</Label>
									<div className="flex items-center">
										<span className="text-lg text-gray-500 dark:text-gray-400 mr-1">
											CDF
										</span>
										<Input
											value={employerShare.toFixed(2)}
											disabled
											className="text-right w-32 h-10 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
										/>
									</div>
								</div>
							)}
						</div>

						<div className="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl flex justify-between items-center">
							<span className="font-medium">Total Amount</span>
							<span className="text-xl font-bold">
								{commissionAmount.toLocaleString()} CDF
							</span>
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								id="email-slip"
								checked={sendEmailToWorker}
								onCheckedChange={(checked) => setSendEmailToWorker(Boolean(checked))}
								className="border-gray-400 dark:border-gray-600 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-600 dark:data-[state=checked]:border-pink-600"
							/>
							<Label
								htmlFor="email-slip"
								className="text-gray-600 dark:text-gray-400"
							>
								{!isAdmin
									? "Send email to admin "
									: "Send payslip to worker by email"}
							</Label>
						</div>
					</div>
				</div>

				<DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
					{isAdmin ? (
						<Button
							onClick={handleApprove}
							disabled={!canAdminApprove || isUpdating}
							variant={buttonVariant}
							className="w-full sm:w-auto"
						>
							{isUpdating ? "Paying..." : buttonText}
						</Button>
					) : (
						<Button
							onClick={handleGenerateOrRequest}
							disabled={buttonDisabled || isCreating || isLockedByTime}
							className="w-full sm:w-auto"
						>
							{isLockedByTime
									? "Indisponible"
								: isCreating
										? "Sending..."
									: buttonText}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
