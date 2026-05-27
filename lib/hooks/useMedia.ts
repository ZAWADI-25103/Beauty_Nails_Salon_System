import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mediasApi } from "../api/media";

export function useMedias(params?: { active?: boolean }) {
	const queryClient = useQueryClient();

	const {
		data: medias = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["medias", params],
		queryFn: () => mediasApi.getMedias(params),
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	// Create package
	const createMutation = useMutation({
		mutationFn: mediasApi.createMedia,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["medias"] });
			toast.success("Document uploaded successfully");
		},
		onError: (err: any) => {
			toast.error(
				err.response?.data?.error?.message ||
					"Error creating media",
			);
		},
	});

	return {
		medias,
		isLoading,
		error,
		refetch,
		createMedia: createMutation.mutate,
		isCreating: createMutation.isPending,
	};
}

export function useMedia(id: string) {
	return useQuery({
		queryKey: ["medias", id],
		queryFn: () => mediasApi.getMedia(id),
		enabled: !!id,
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});
}
