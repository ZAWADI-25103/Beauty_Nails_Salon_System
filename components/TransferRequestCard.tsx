"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	MapPin,
	Phone,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRespondToTransfer } from "@/lib/hooks/useTransfers";

interface TransferRequestCardProps {
	transfer: any;
	onAccepted?: () => void;
	onRejected?: () => void;
}

export default function TransferRequestCard({
	transfer,
	onAccepted,
	onRejected,
}: TransferRequestCardProps) {
	const [showNotes, setShowNotes] = useState(false);
	const [rejectionNote, setRejectionNote] = useState("");

	const respondToTransfer = useRespondToTransfer();

	const appointment = transfer.appointment;
	const originalWorker = transfer.originalWorker.user;

	const handleAccept = () => {
		respondToTransfer.mutate(
			{
				transferId: transfer.id,
				action: "accept",
			},
			{
				onSuccess: () => {
					onAccepted?.();
				},
			},
		);
	};

	const handleReject = () => {
		if (showNotes && !rejectionNote.trim()) {
			toast.error("Veuillez indiquer une raison pour le refus");
			return;
		}

		respondToTransfer.mutate(
			{
				transferId: transfer.id,
				action: "reject",
				notes: rejectionNote.trim() || undefined,
			},
			{
				onSuccess: () => {
					onRejected?.();
					setShowNotes(false);
					setRejectionNote("");
				},
			},
		);
	};

	return (
		<Card className="group relative overflow-hidden rounded-3xl border border-pink-100 dark:border-pink-900/30 bg-gradient-to-br from-white via-pink-50/40 to-rose-50/60 dark:from-gray-950 dark:via-pink-950/10 dark:to-rose-950/10 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
			{/* Decorative Glow */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 blur-3xl rounded-full pointer-events-none" />

			{/* Header */}
			<div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
				<div className="flex items-start gap-4">
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/20">
						<AlertCircle className="w-7 h-7 text-white" />
					</div>

					<div className="min-w-0">
						<h4 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
							Demande de transfert
						</h4>

						<p className="text-sm sm:text-base text-pink-700 dark:text-pink-300 mt-1 break-words">
							De {originalWorker.name} •{" "}
							{format(new Date(transfer.requestedAt), "HH:mm", {
								locale: fr,
							})}
						</p>
					</div>
				</div>

				<Badge className="w-fit rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 px-4 py-1.5 text-sm shadow-md">
					En attente
				</Badge>
			</div>

			{/* Appointment Details */}
			<div className="space-y-5 mb-5 p-5 rounded-2xl bg-white/90 dark:bg-gray-900/70 border border-pink-100 dark:border-pink-900/20 shadow-sm backdrop-blur">
				{/* Client */}
				<div className="flex items-center gap-4">
					<Avatar className="h-14 w-14 border-2 border-pink-100 dark:border-pink-900">
						<AvatarFallback className="bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700 text-lg font-semibold">
							{appointment.client?.user?.name?.charAt(0) || "C"}
						</AvatarFallback>
					</Avatar>

					<div className="min-w-0">
						<p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
							{appointment.client?.user?.name}
						</p>

						<p className="text-sm sm:text-base text-pink-600 dark:text-pink-300 font-medium">
							{appointment.service?.name}
						</p>
					</div>
				</div>

				{/* Details Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
					<div className="flex items-start gap-3 rounded-xl bg-pink-50 dark:bg-pink-950/10 p-3">
						<Clock className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />

						<div className="text-gray-700 dark:text-gray-300">
							<p className="font-medium">Date & Heure</p>
							<p className="text-sm text-muted-foreground">
								{format(new Date(appointment.date), "PPP", {
									locale: fr,
								})}
							</p>
							<p className="text-sm text-muted-foreground">
								{appointment.time}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 rounded-xl bg-pink-50 dark:bg-pink-950/10 p-3">
						<MapPin className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />

						<div className="text-gray-700 dark:text-gray-300">
							<p className="font-medium">Lieu</p>
							<p className="text-sm text-muted-foreground">
								{appointment.location === "salon" ? "Salon" : "À domicile"}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 rounded-xl bg-pink-50 dark:bg-pink-950/10 p-3">
						<Phone className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />

						<div className="text-gray-700 dark:text-gray-300 min-w-0">
							<p className="font-medium">Téléphone</p>
							<p className="text-sm text-muted-foreground break-all">
								{appointment.client?.user?.phone}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 p-3 text-white shadow-md">
						<div>
							<p className="font-medium">Montant</p>

							<p className="text-lg sm:text-xl font-bold">
								{appointment.price.toLocaleString()} CDF
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transfer Reason */}
			{transfer.transferReason && (
				<div className="mb-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/10 p-4">
					<p className="text-sm sm:text-base text-amber-800 dark:text-amber-200 leading-relaxed">
						<strong>Raison :</strong> {transfer.transferReason}
					</p>
				</div>
			)}

			{/* Commission */}
			{transfer.transferFeeAmount > 0 && (
				<div className="mb-5 rounded-2xl border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/10 p-4">
					<p className="text-sm sm:text-base text-green-800 dark:text-green-200 leading-relaxed">
						<strong>Commission pour vous :</strong>{" "}
						{transfer.transferFeeAmount.toLocaleString()} CDF (
						{transfer.transferFeePercentage}%)
					</p>
				</div>
			)}

			{/* Rejection Notes */}
			{showNotes && (
				<div className="mb-5">
					<label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
						Raison du refus
					</label>

					<textarea
						value={rejectionNote}
						onChange={(e) => setRejectionNote(e.target.value)}
						placeholder="Expliquez pourquoi vous ne pouvez pas accepter ce transfert..."
						rows={4}
						className="w-full rounded-2xl border border-pink-200 dark:border-pink-900/30 bg-white dark:bg-gray-900 p-4 text-sm sm:text-base text-gray-900 dark:text-white outline-none ring-0 focus:border-pink-400 focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-900/30 transition-all resize-none"
					/>
				</div>
			)}

			{/* Actions */}
			<div className="flex flex-col sm:flex-row gap-3 pt-2">
				<Button
					onClick={handleAccept}
					disabled={respondToTransfer.isPending}
					className="flex-1 h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-base font-semibold shadow-lg shadow-green-500/20"
				>
					<CheckCircle className="w-5 h-5 mr-2" />

					{respondToTransfer.isPending ? "Traitement..." : "Accepter"}
				</Button>

				{!showNotes ? (
					<Button
						onClick={() => setShowNotes(true)}
						variant="outline"
						className="flex-1 h-12 sm:h-14 rounded-2xl border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20 text-base font-semibold"
					>
						<XCircle className="w-5 h-5 mr-2" />
						Refuser
					</Button>
				) : (
					<>
						<Button
							onClick={handleReject}
							disabled={respondToTransfer.isPending}
							variant="destructive"
							className="flex-1 h-12 sm:h-14 rounded-2xl text-base font-semibold"
						>
							<XCircle className="w-5 h-5 mr-2" />
							Confirmer
						</Button>

						<Button
							onClick={() => {
								setShowNotes(false);
								setRejectionNote("");
							}}
							variant="outline"
							className="flex-1 h-12 sm:h-14 rounded-2xl text-base font-semibold"
						>
							Annuler
						</Button>
					</>
				)}
			</div>
		</Card>
	);
}
