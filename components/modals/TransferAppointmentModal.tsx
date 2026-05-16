"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, MapPin, Percent, Phone, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useRequestTransfer } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAvailableStaff } from "@/lib/hooks/useStaff";

interface TransferAppointmentModalProps {
	appointment: any;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export default function TransferAppointmentModal({
	appointment,
	trigger,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
}: TransferAppointmentModalProps) {
	const { user } = useAuth();

	const { staff, isLoading: staffLoading } = useAvailableStaff();

	const requestTransfer = useRequestTransfer();

	const [open, setOpen] = useState(false);

	const [selectedWorker, setSelectedWorker] = useState("");

	const [transferReason, setTransferReason] = useState("");

	const [transferFee, setTransferFee] = useState(5);

	const isOpen = controlledOpen !== undefined ? controlledOpen : open;

	const onOpenChange = controlledOnOpenChange || setOpen;

	useEffect(() => {
		if (!isOpen) {
			setSelectedWorker("");
			setTransferReason("");
			setTransferFee(5);
		}
	}, [isOpen]);

	const canRequest =
		user?.role === "worker" && appointment?.worker?.user?.id === user.id;

	const transferFeeAmount = (appointment?.price || 0) * (transferFee / 100);

	const handleRequestTransfer = () => {
		if (!selectedWorker) {
			toast.error("Please select an employee");
			return;
		}

		requestTransfer.mutate(
			{
				appointmentId: appointment.id,
				data: {
					newWorkerId: selectedWorker,
					transferReason,
					transferFeePercentage: transferFee,
				},
			},
			{
				onSuccess: () => {
					onOpenChange(false);
				},
			},
		);
	};

	if (!appointment) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

			<DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-hidden border-0 bg-transparent shadow-none p-1 sm:p-2">
				<div className="relative overflow-hidden rounded-lg border border-pink-100 dark:border-pink-900/20 bg-linear-to-br from-white via-pink-50 to-rose-50 dark:from-[#140814] dark:via-[#1a0d1f] dark:to-[#12070f] shadow-[0_20px_80px_rgba(236,72,153,0.18)]">
					{/* Glow */}
					<div className="absolute -top-24 -right-24 h-56 w-56 rounded-lg bg-pink-400/20 blur-3xl" />

					{/* Scrollable Container */}
					<div className="relative z-10 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 dark:scrollbar-thumb-pink-900 scrollbar-track-transparent">
						{/* Header */}
						<DialogHeader className="border-b border-pink-100 dark:border-pink-900/20 p-4 sm:p-6">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-linear-to-br from-pink-500 via-rose-500 to-fuchsia-500 shadow-lg shadow-pink-500/20 shrink-0">
									<Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
								</div>

								<div className="min-w-0">
									<DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
										Transfer Appointment
									</DialogTitle>

									<p className="mt-1 text-xs sm:text-sm text-pink-700 dark:text-pink-300">
										Réattribuer ce rendez-vous élégamment
									</p>
								</div>
							</div>
						</DialogHeader>

						{/* Body */}
						<div className="space-y-5 p-4 sm:p-6">
							{/* Appointment Summary */}
							<Card className="overflow-hidden rounded-3xl border border-pink-100 dark:border-pink-900/20 bg-white/90 dark:bg-black/20 backdrop-blur-xl shadow-lg">
								<div className="bg-linear-to-r from-pink-500 to-rose-500 h-1.5 w-full" />

								<div className="p-4 sm:p-5">
									{/* Top */}
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										{/* Client */}
										<div className="flex items-center gap-3 min-w-0 flex-1">
											<Avatar className="h-14 w-14 border-4 border-pink-100 dark:border-pink-900/30 shrink-0">
												<AvatarFallback className="bg-linear-to-br from-pink-100 to-rose-100 text-pink-700 text-lg font-bold">
													{appointment.client?.user?.name?.charAt(0) || "C"}
												</AvatarFallback>
											</Avatar>

											<div className="min-w-0">
												<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
													{appointment.client?.user?.name}
												</h3>

												<p className="text-sm sm:text-base text-pink-600 dark:text-pink-300 font-medium truncate">
													{appointment.service?.name}
												</p>
											</div>
										</div>

										{/* Price */}
										<div className="rounded-lg bg-linear-to-r from-pink-500 to-rose-500 px-4 py-3 text-white shadow-lg w-full sm:w-auto">
											<p className="text-xs opacity-90">Montant</p>

											<p className="text-lg sm:text-xl font-bold">
												{appointment.price.toLocaleString()} CDF
											</p>
										</div>
									</div>

									{/* Details */}
									<div className="mt-5 grid grid-cols-1 gap-3">
										<div className="rounded-lg bg-pink-50 dark:bg-pink-950/10 p-3">
											<div className="flex items-start gap-3">
												<Clock className="w-4 h-4 text-pink-500 mt-1 shrink-0" />

												<div>
													<p className="font-medium text-sm text-gray-900 dark:text-white">
														Horaire
													</p>

													<p className="text-xs sm:text-sm text-muted-foreground">
														{appointment.time}
													</p>

													<p className="text-xs sm:text-sm text-muted-foreground">
														{format(new Date(appointment.date), "PPP", {
															locale: fr,
														})}
													</p>
												</div>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="rounded-lg bg-pink-50 dark:bg-pink-950/10 p-3">
												<div className="flex items-start gap-3">
													<MapPin className="w-4 h-4 text-pink-500 mt-1 shrink-0" />

													<div>
														<p className="font-medium text-sm text-gray-900 dark:text-white">
															Lieu
														</p>

														<p className="text-xs sm:text-sm text-muted-foreground">
															{appointment.location === "salon"
																? "Salon"
																: "At home"}
														</p>
													</div>
												</div>
											</div>

											<div className="rounded-lg bg-pink-50 dark:bg-pink-950/10 p-3">
												<div className="flex items-start gap-3">
													<Phone className="w-4 h-4 text-pink-500 mt-1 shrink-0" />

													<div className="min-w-0">
														<p className="font-medium text-sm text-gray-900 dark:text-white">
															Téléphone
														</p>

														<p className="text-xs sm:text-sm text-muted-foreground break-all">
															{appointment.client?.user?.phone}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</Card>

							{/* Form */}
							{canRequest && (
								<div className="space-y-5">
									{/* Worker Select */}
									<div className="space-y-2">
										<Label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
											Styliste
										</Label>

										<Select
											value={selectedWorker}
											onValueChange={setSelectedWorker}
										>
											<SelectTrigger className="h-12 rounded-lg border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/20 text-sm sm:text-base">
												<SelectValue placeholder="Choisir un professionnel" />
											</SelectTrigger>

											<SelectContent className="rounded-lg border-pink-100">
												{staffLoading ? (
													<div className="p-3 text-sm text-muted-foreground">
														Chargement...
													</div>
												) : (
													staff
														.filter((w) => w.id !== appointment.workerId)
														.map((worker) => (
															<SelectItem
																key={worker.id}
																value={worker.id}
																className="rounded-xl py-3"
															>
																{worker.user?.name}
															</SelectItem>
														))
												)}
											</SelectContent>
										</Select>
									</div>

									{/* Reason */}
									<div className="space-y-2">
										<Label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
											Motif
										</Label>

										<Textarea
											value={transferReason}
											onChange={(e) => setTransferReason(e.target.value)}
											placeholder="Ex: urgence, retard..."
											rows={3}
											className="rounded-lg border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/20 p-3 text-sm sm:text-base resize-none focus-visible:ring-pink-400"
										/>
									</div>

									{/* Commission */}
									<div className="rounded-3xl border border-pink-100 dark:border-pink-900/20 bg-white/80 dark:bg-black/20 p-4">
										<div className="flex items-center gap-3 mb-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20 shrink-0">
												<Percent className="w-5 h-5 text-pink-500" />
											</div>

											<div>
												<h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
													Commission
												</h4>

												<p className="text-xs sm:text-sm text-muted-foreground">
													Partage du rendez-vous
												</p>
											</div>
										</div>

										<div className="flex flex-col sm:flex-row sm:items-center gap-3">
											<div className="relative w-full sm:w-32">
												<Input
													type="number"
													min="0"
													max="50"
													step="0.1"
													value={transferFee}
													onChange={(e) =>
														setTransferFee(parseFloat(e.target.value) || 0)
													}
													className="h-12 rounded-lg border-pink-200 dark:border-pink-900/30 text-base font-semibold pr-10"
												/>

												<Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
											</div>

											<div className="rounded-lg bg-linear-to-r from-pink-500 to-rose-500 px-4 py-3 text-white shadow-lg flex-1">
												<p className="text-xs opacity-90">Estimation</p>

												<p className="text-lg font-bold">
													{transferFeeAmount.toLocaleString()} CDF
												</p>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Footer */}
						<DialogFooter className="border-t border-pink-100 dark:border-pink-900/20 p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row gap-2 w-full">
								<Button
									variant="outline"
									onClick={() => onOpenChange(false)}
									className="h-11 sm:h-12 rounded-lg border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/20 text-sm sm:text-base flex-1"
								>
									Annuler
								</Button>

								{canRequest && (
									<Button
										onClick={handleRequestTransfer}
										disabled={requestTransfer.isPending || !selectedWorker}
										className="h-11 sm:h-12 rounded-lg bg-linear-to-r from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white text-sm sm:text-base font-semibold shadow-lg shadow-pink-500/20 flex-1"
									>
										<Wand2 className="w-4 h-4 mr-2" />

										{requestTransfer.isPending ? "Sending..." : "Transfer"}
									</Button>
								)}
							</div>
						</DialogFooter>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
