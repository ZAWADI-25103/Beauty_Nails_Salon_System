import {
	mutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { clientsApi } from "../api/clients";
import {
	CreateAddOnData,
	CreateServiceData,
	type Service,
	type ServiceAddOn,
	servicesApi,
} from "../api/services";

export function useServices(params?: {
	category?: string;
	available?: boolean;
}) {
	const queryClient = useQueryClient();

	const {
		data: services = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["services", params],
		queryFn: () => servicesApi.getServices(params),
	});

	// Create service
	const {
		mutate: createService,
		data: createdService,
		isPending: isCreating,
	} = useMutation({
		mutationFn: servicesApi.createService,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.error?.message || "Error creating");
		},
	});

	// Update service
	const updateMutation = useMutation({
		mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) =>
			servicesApi.updateService(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			toast.success("Service updated");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error updating",
			);
		},
	});

	// Delete service
	const deleteMutation = useMutation({
		mutationFn: servicesApi.deleteService,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			toast.success("Service deleted");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error deleting",
			);
		},
	});

	return {
		services,
		isLoading,
		error,
		refetch,
		createService: createService,
		createdService: createdService,
		updateService: updateMutation.mutate,
		updatedService: updateMutation.data,
		deleteService: deleteMutation.mutate,
		isCreating: isCreating,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}

export function useService(id: string) {
	return useQuery({
		queryKey: ["services", id],
		queryFn: () => servicesApi.getService(id),
		enabled: !!id,
	});
}

export function useAddOns(serviceId: string) {
	return useQuery({
		queryKey: ["services", serviceId, "add-ons"],
		queryFn: () => servicesApi.getAddOns(serviceId),
		enabled: !!serviceId,
	});
}

export function useClientReferrals(clientId: string | undefined) {
	return useQuery({
		queryKey: ["clients", clientId, "referrals"],
		queryFn: () => clientsApi.getClientReferrals(clientId),
		enabled: !!clientId,
	});
}

export function useAddOnMutations() {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: servicesApi.createAddOn,
		onSuccess: (data) => {
			// Invalidate the service query to update the service with new add-ons
			if (data.addOn.serviceId) {
				queryClient.invalidateQueries({
					queryKey: ["services", data.addOn.serviceId],
				});
				queryClient.invalidateQueries({ queryKey: ["services"] });
			}
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.error?.message || "Error creating");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<ServiceAddOn>;
		}) => servicesApi.updateAddOn(id, updates),
		onSuccess: () => {
			// Invalidate the service query to update the service with updated add-ons
			queryClient.invalidateQueries({ queryKey: ["services"] });
			toast.success("Add-on updated");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error updating",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: servicesApi.deleteAddOn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
			toast.success("Add-on deleted");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message || "Error deleting",
			);
		},
	});

	return {
		createAddOn: createMutation.mutate,
		updateAddOn: updateMutation.mutate,
		deleteAddOn: deleteMutation.mutate,
		isCreatingAddOn: createMutation.isPending,
		isUpdatingAddOn: updateMutation.isPending,
		isDeletingAddOn: deleteMutation.isPending,
	};
}
