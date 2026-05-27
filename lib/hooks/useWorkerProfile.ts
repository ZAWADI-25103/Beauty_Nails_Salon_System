import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { workerApiFunctions } from "../api/workerApiFunctions";

export function useWorkerProfiles() {
	const { data: workers, isLoading } = useQuery({
		queryKey: ["workers-profile"],
		queryFn: () => workerApiFunctions.getWorkerProfiles(),
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	return {
		workers,
		isLoading,
	};
}

export function useWorkerProfile(userId: string) {
	const queryClient = useQueryClient();

	const {
		data: profile,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["worker-profile", userId],
		queryFn: () => workerApiFunctions.getWorkerProfile(userId),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	const updateProfileMutation = useMutation({
		mutationFn: (data: any) =>
			workerApiFunctions.updateWorkerProfile(userId, data),
		onSuccess: (updatedProfile) => {
			queryClient.setQueryData(["worker-profile", userId], updatedProfile);
			queryClient.invalidateQueries({ queryKey: ["workers"] });
			toast.success("Profile updated successfully");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error updating profile",
			);
		},
	});

	const getCommissionReport = (period?: string) => {
		return workerApiFunctions.getCommissionReport(userId, period);
	};

	const getPaymentHistory = () => {
		return workerApiFunctions.getPaymentHistory(userId);
	};

	const getEarningsStatement = (period?: string) => {
		return workerApiFunctions.getEarningsStatement(userId, period);
	};

	return {
		profile,
		isLoading,
		error,
		updateProfile: updateProfileMutation.mutate,
		isUpdating: updateProfileMutation.isPending,
		getCommissionReport,
		getPaymentHistory,
		getEarningsStatement,
	};
}
