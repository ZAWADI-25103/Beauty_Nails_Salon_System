import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewsApi } from "../api/review";
import { TasksParams, tasksApi } from "../api/tasks";

export function useReviews(params?: { clientId?: string; workerId?: string }) {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["reviews"],
		queryFn: () => reviewsApi.getReviews(),
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	// Create service
	const { mutate: createReview, isPending: isCreating } = useMutation({
		mutationFn: reviewsApi.createReview,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["reviews"] });
			toast.success(data.message);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.error?.message || "Error creating");
		},
	});

	return {
		reviews: data,
		isLoading,
		createReview,
		isCreating,
	};
}
