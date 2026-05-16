import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { appointmentsApi } from "../api/appointments";
import {
	type CreatePackageData,
	packagesApi,
	ServicePackage,
} from "../api/packages";

export function usePackages(params?: { active?: boolean }) {
	const queryClient = useQueryClient();

	const {
		data: packages = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["packages", params],
		queryFn: () => packagesApi.getPackages(params),
		staleTime: 5 * 60 * 1000,
	});

	// Create package
	const createMutation = useMutation({
		mutationFn: packagesApi.createPackage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["packages"] });
			toast.success("Package created successfully");
		},
		onError: (err: any) => {
			toast.error(
				err.response?.data?.error?.message ||
					"Error creating package",
			);
		},
	});

	// Update package
	const updateMutation = useMutation({
		mutationFn: ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<CreatePackageData>;
		}) => packagesApi.updatePackage(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["packages"] });
			toast.success("Package updated");
		},
		onError: (err: any) => {
			toast.error(
				err.response?.data?.error?.message || "Error updating",
			);
		},
	});

	// Delete package
	const deleteMutation = useMutation({
		mutationFn: packagesApi.deletePackage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["packages"] });
			toast.success("Package deleted");
		},
		onError: (err: any) => {
			toast.error(
				err.response?.data?.error?.message || "Error deleting",
			);
		},
	});

	return {
		packages,
		isLoading,
		error,
		createPackage: createMutation.mutate,
		updatePackage: updateMutation.mutate,
		deletePackage: deleteMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}

// export function usePackage(id: string) {
//   return useQuery({
//     queryKey: ['packages', id],
//     queryFn: () => packagesApi.getPackage(id),
//     enabled: !!id,
//   });
// }

// export function usePackages(params?: { active?: boolean }) {
//   return useQuery({
//     queryKey: ['packages', params],
//     queryFn: () => packagesApi.getPackages(params),
//     staleTime: 5 * 60 * 1000,
//   });
// }

export function usePackage(id: string) {
	return useQuery({
		queryKey: ["packages", id],
		queryFn: () => packagesApi.getPackage(id),
		enabled: !!id,
	});
}

export function useBookPackage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: packagesApi.bookPackage,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			queryClient.invalidateQueries({ queryKey: ["packages"] });
			toast.success(data.message || "Package booked successfully");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error booking package",
			);
		},
	});
}
