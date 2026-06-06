import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transfersApi } from "../api/transfers";

export function usePendingTransfers() {
	return useQuery({
		queryKey: ["transfers", "pending"],
		queryFn: () => transfersApi.getPendingTransfers(),
		refetchOnWindowFocus: true,
		refetchOnReconnect: true, // Auto-refetch every 30 seconds
	});
}

export function useRespondToTransfer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			transferId,
			action,
			notes,
		}: {
			transferId: string;
			action: "accept" | "reject";
			notes?: string;
		}) => transfersApi.respondToTransfer(transferId, action, notes),
		onSuccess: (data, variables) => {
			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: ["transfers", "pending"] });
			queryClient.invalidateQueries({ queryKey: ["appointments"] });

			toast.success(
				variables.action === "accept"
					? "✓ Transfer accepted - Appointment added to your schedule"
					: "✗ Transfer rejected",
			);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error processing transfer",
			);
		},
	});
}
