"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	appointmentsApi,
	type RescheduleAppointmentData,
	type TransferRequestData,
	type UpdateAppointmentStatusData,
} from "../api/appointments";

export function useAppointments(params?: {
	date?: Date | string;
	status?: string;
	workerId?: string;
	clientId?: string;
	hasPackage?: boolean;
}) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString("en-US", {
				day: "numeric",
				month: "long",
			});
		};

	// Get appointments
	const {
		data: appointments = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["appointments", params],
		queryFn: () => appointmentsApi.getAppointments(params),
		refetchInterval: 60 * 1000, // Refetch every 60 seconds
	});

	// Create appointment
	const createMutation = useMutation({
		mutationFn: appointmentsApi.createAppointment,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success("Appointment created successfully!", {
				description: `Your appointment is scheduled for ${formatDate(data.appointment.date)} at ${data.appointment.time}`,
			});
			if (data.canGenerateReceipt) {
				const storage =
					typeof window !== "undefined" ? window.localStorage : null;
				storage?.setItem("time", "5");
				router.push(
					`dashboard/client?url=${encodeURIComponent(data.receiptUrl)}`,
				);
			} else router.push("/dashboard/client");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error when creating appointment",
			);
		},
	});
	// Create appointment
	const createMutationAsAdmin = useMutation({
		mutationFn: appointmentsApi.createAppointment,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success("Appointment confirmed!", {
				description: `Your appointment is scheduled for ${formatDate(data.appointment.date)} at ${data.appointment.time}`,
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error when creating appointment",
			);
		},
	});

	// Update status
	const updateStatusMutation = useMutation({
		mutationFn: ({
			id,
			statusData,
		}: {
			id: string;
			statusData: UpdateAppointmentStatusData;
		}) => appointmentsApi.updateAppointmentStatus(id, statusData),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success(data.message);
		},
		onError: (error: any) => {
			console.log("Error updating appointment status:", error);
			toast.error(
				error.response?.data?.error?.message || "Error updating appointment status",
			);
		},
	});

	// Cancel appointment
	const cancelMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			appointmentsApi.cancelAppointment(id, reason),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error canceling appointment",
			);
		},
	});

	// Reschedule appointment
	const rescheduleMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: RescheduleAppointmentData;
		}) => appointmentsApi.rescheduleAppointment(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success("Appointment rescheduled");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error rescheduling appointment",
			);
		},
	});

	return {
		appointments,
		isLoading,
		error,
		refetch,
		createAppointment: createMutation.mutate,
		createAppointmentAsAdmin: createMutationAsAdmin.mutate,
		updateStatus: updateStatusMutation.mutate,
		cancelAppointment: cancelMutation.mutate,
		rescheduleAppointment: rescheduleMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateStatusMutation.isPending,
	};
}

export function useAppointment(id: string) {
	return useQuery({
		queryKey: ["appointments", id],
		queryFn: () => appointmentsApi.getAppointment(id),
		enabled: !!id,
	});
}

export function useAvailableSlots(params?: {
	date?: string;
	workerId: string;
}) {
	const { data, isLoading } = useQuery({
		queryKey: ["appointments", "available-slots", params],
		queryFn: () => appointmentsApi.getAvailableSlots(params),
		enabled: !!params?.date && !!params?.workerId,
	});
	return {
		data,
		isLoading,
	};
}

export function useAppointmentTransfer(appointmentId: string) {
	return useQuery({
		queryKey: ["appointments", appointmentId, "transfer"],
		queryFn: () => appointmentsApi.getTransfer(appointmentId),
		enabled: !!appointmentId,
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function useRequestTransfer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			appointmentId,
			data,
		}: {
			appointmentId: string;
			data: TransferRequestData;
		}) => appointmentsApi.requestTransfer(appointmentId, data),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			queryClient.invalidateQueries({
				queryKey: ["appointments", variables.appointmentId, "transfer"],
			});
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error when requesting transfer",
			);
		},
	});
}

export function useRespondToTransfer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			appointmentId,
			action,
			notes,
		}: {
			appointmentId: string;
			action: "accept" | "reject";
			notes?: string;
		}) => appointmentsApi.respondToTransfer(appointmentId, action, notes),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			queryClient.invalidateQueries({
				queryKey: ["appointments", variables.appointmentId, "transfer"],
			});
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error when responding to transfer request",
			);
		},
	});
}
