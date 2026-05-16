import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ClientsParams, clientsApi } from "../api/clients";

export function useClients(params?: ClientsParams) {
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["clients", params],
		queryFn: () => clientsApi.getClients(params),
	});

	// Update notes
	const updateNotesMutation = useMutation({
		mutationFn: ({ id, notes }: { id: string; notes: string }) =>
			clientsApi.updateClientNotes(id, notes),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Update error",
			);
		},
	});

	// Create client
	const createClientMutation = useMutation({
		mutationFn: (payload: {
			name: string;
			email: string;
			phone: string;
			tier?: string;
			notes?: string;
			password?: string;
			birthday?: string;
			address?: string;
			allergies: string[];
			favoriteServices: string[];
			prepaymentBalance?: number | string;
			giftCardBalance?: number | string;
			referrals?: number;
		}) => clientsApi.createClient(payload),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			toast.success(data.message || "Client created");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error creating client",
			);
		},
	});
	// Update client
	const updateClientMutation = useMutation({
		mutationFn: (payload: {
			userId: string;
			name: string;
			email: string;
			phone: string;
			tier?: string;
			notes?: string;
			password?: string;
			birthday?: string;
			address?: string;
			allergies: string[];
			favoriteServices: string[];
			prepaymentBalance?: number | string;
			giftCardBalance?: number | string;
			referrals?: number;
		}) => clientsApi.updateClient(payload),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			toast.success(data.message || "Client updated");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error updating client",
			);
		},
	});

	return {
		clients: data?.clients || [],
		pagination: data?.pagination,
		isLoading,
		error,
		updateNotes: updateNotesMutation.mutate,
		isUpdatingNotes: updateNotesMutation.isPending,
		createClient: createClientMutation.mutate,
		updateClient: updateClientMutation.mutate,
		isUpdatingClient: updateClientMutation.isPending,
		isCreatingClient: createClientMutation.isPending,
	};
}

export function useClient(id: string) {
	return useQuery({
		queryKey: ["clients", id],
		queryFn: () => clientsApi.getClient(id),
		enabled: !!id,
	});
}

export function useClientAppointments(
	id: string,
	params?: {
		status?: string;
		from?: string;
		to?: string;
	},
) {
	return useQuery({
		queryKey: ["clients", id, "appointments", params],
		queryFn: () => clientsApi.getClientAppointments(id, params),
		enabled: !!id,
	});
}
