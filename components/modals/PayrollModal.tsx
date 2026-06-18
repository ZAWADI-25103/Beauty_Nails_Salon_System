import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import type { Worker } from "@/lib/api/staff";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCommission, useWorker } from "@/lib/hooks/useStaff";
import { Frequency, getNextResetDate, PayrollCountdown } from "../PayrollCountdown";
// --- Payroll Modal (Mobile Optimized with Dark Mode) ---

interface PayrollModalProps {
	staffName?: string;
	staff?: Worker;
	period: Frequency;
	commission?: any;
	trigger?: React.ReactNode;
}

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
	const autoRequestTriggeredRef = useRef(false);
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

    useEffect(() => {
		if (autoRequestTriggeredRef.current) {
			return;
		}

		if (
			!isAdmin &&
			isPaymentAvailable &&
			activePeriod &&
			!payoutCommissionExists
		) {
			autoRequestTriggeredRef.current = true;
			handleGenerateOrRequest();
		}
	}, [
		activePeriod,
		isAdmin,
		isPaymentAvailable,
		payoutCommissionExists,
	]);

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
		if (!staff) {
			return;
		}

		if (isPeriodPaid(activePeriod)) {
			toast.info("This period has already been paid.");
			return;
		}

		if (payoutCommissionExists) {
			// If record exists but is not paid, worker is requesting approval
			if (!isAdmin) {
				toast.info(
					"Payment request already exists for this period. Awaiting admin approval.",
				);
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
				period: activePeriod,
			});
			refetch();
		} else {
			// Backend logic might differ.
			createCommission({
				workerId: staff.id,
				period: activePeriod,
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
	let buttonText = "Request Payment";
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
											value={`${format(getNextResetDate(period, workerProfile?.commissionDay || 1),
												"PPP 'at'  HH:mm",
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
							frequency={workerProfile?.commissionFrequency as Frequency}
							commissionDay={workerProfile?.commissionDay || 1}
                            lastCommissionPaidAt={workerProfile?.lastCommissionPaidAt}
                            workerName={staffName || staff?.user?.name || "Employee"}
                            userId={staff?.user?.id}
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
