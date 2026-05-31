"use client";

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	Calendar,
	Droplet,
	FileText,
	Package,
	Scale,
	User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useItemUsageHistory } from "@/lib/hooks/useInventoryUsage";

interface InventoryUsageHistoryModalProps {
	itemId: string;
	itemName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function InventoryUsageHistoryModal({
	itemId,
	itemName,
	open,
	onOpenChange,
}: InventoryUsageHistoryModalProps) {
	const { user } = useAuth();
	const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
	const dateParams = useMemo(() => {
		if (dateRange !== "week") {
			return {
				startDate: undefined,
				endDate: undefined,
			};
		}

		const now = new Date();

		return {
			startDate: new Date(
				now.getTime() - 7 * 24 * 60 * 60 * 1000,
			).toISOString(),
			endDate: now.toISOString(),
		};
	}, [dateRange]);

	const { data, isLoading } = useItemUsageHistory(itemId, dateParams);

	const {
		appointments = [],
		isLoading: isAppointmentsLoading,
		updateStatus,
	} = useAppointments();

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "PPP 'at' HH:mm", { locale: enUS });
	};

	const getAppointmentServiceName = (appointmentId: string) => {
		const appointment = appointments.find((a) => a.id === appointmentId);
		return appointment?.service?.name || "Unknown Service";
	};

	const getWorkerName = (workerId: string) => {
		const appointment = appointments.find((a) => a.workerId === workerId);
		return appointment?.worker?.user?.name || "Unknown";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Usage History - {itemName}</DialogTitle>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Track usage by technicians and appointments
					</p>
				</DialogHeader>

				<div className="space-y-6">
					{/* Stats Overview */}
					{data?.stats && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<Card className="p-4 text-center">
								<div className="text-2xl font-bold text-pink-600">
									{data.stats.totalUsed}
								</div>
								<div className="text-xs text-gray-500">Total used</div>
							</Card>
							<Card className="p-4 text-center">
								<div className="text-2xl font-bold text-blue-600">
									{data.stats.uniqueAppointments}
								</div>
								<div className="text-xs text-gray-500">Appointments</div>
							</Card>
							<Card className="p-4 text-center">
								<div className="text-2xl font-bold text-purple-600">
									{data.stats.uniqueWorkers}
								</div>
								<div className="text-xs text-gray-500">Technicians</div>
							</Card>
							<Card className="p-4 text-center">
								<div className="text-2xl font-bold text-amber-600">
									{data.stats.averagePerAppointment.toFixed(1)}
								</div>
								<div className="text-xs text-gray-500">Avg/Appointment</div>
							</Card>
						</div>
					)}

					{/* Filters */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Select
							value={dateRange}
							onValueChange={(v: any) => setDateRange(v)}
						>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Period" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="week">This week</SelectItem>
								<SelectItem value="month">This month</SelectItem>
								<SelectItem value="all">All history</SelectItem>
							</SelectContent>
						</Select>
						<Input
							placeholder="Search an appointment..."
							className="flex-1"
						/>
					</div>

					{/* Usage List */}
					<div className="space-y-3">
						{isLoading ? (
							<div className="text-center py-8 text-gray-500">
								Loading...
							</div>
						) : data?.usages?.length === 0 ? (
							<Card className="p-6 text-center">
								<Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
								<p className="text-gray-500">No usage recorded</p>
							</Card>
						) : (
							data?.usages?.map((usage) => (
								<Card key={usage.id} className="p-4 hover:shadow-md transition">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<Badge variant="outline" className="text-[10px]">
													{usage.item.unit === "ml" && (
														<Droplet className="w-3 h-3 mr-1" />
													)}
													{usage.item.unit === "g" && (
														<Scale className="w-3 h-3 mr-1" />
													)}
													{usage.item.unit}
												</Badge>
												<span className="font-medium">
													{usage.quantity} {usage.item.unit}
												</span>
											</div>

											{usage.usedFor && (
												<div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-1">
													<FileText className="w-4 h-4" />
													<span>
														App #{usage.usedFor.slice(-6)} -{" "}
														{getAppointmentServiceName(usage.usedFor)}
													</span>
												</div>
											)}

											{usage.usedBy && (
												<div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
													<User className="w-4 h-4" />
													<span>
														Used by: {getWorkerName(usage.usedBy)}
													</span>
												</div>
											)}

											{usage.notes && (
												<p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
													"{usage.notes}"
												</p>
											)}
										</div>

										<div className="text-right text-sm text-gray-500 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												<span>{formatDate(usage.createdAt)}</span>
											</div>
										</div>
									</div>
								</Card>
							))
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
