import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type DiscountCode,
	type MarketingCampaign,
	marketingApi,
} from "../api/marketing";

export function useCampaigns() {
	const queryClient = useQueryClient();

	const {
		data: campaigns = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["campaigns"],
		queryFn: marketingApi.getCampaigns,
	});

	const createMutation = useMutation({
		mutationFn: marketingApi.createCampaign,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			toast.success("Campaign created successfully");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error creating",
			),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<MarketingCampaign>;
		}) => marketingApi.updateCampaign(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			toast.success("Campaign updated");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error updating",
			),
	});

	const deleteMutation = useMutation({
		mutationFn: marketingApi.deleteCampaign,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			toast.success("Campaign deleted");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error deleting",
			),
	});

	const sendMutation = useMutation({
		mutationFn: marketingApi.sendCampaign,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			toast.success(data.message);
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error sending",
			),
	});

	return {
		campaigns,
		isLoading,
		error,
		createCampaign: createMutation.mutate,
		updateCampaign: updateMutation.mutate,
		deleteCampaign: deleteMutation.mutate,
		sendCampaign: sendMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isSending: sendMutation.isPending,
	};
}

export function useDiscounts() {
	const queryClient = useQueryClient();

	const {
		data: discounts = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["discounts"],
		queryFn: marketingApi.getDiscounts,
	});

	const createMutation = useMutation({
		mutationFn: marketingApi.createDiscount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["discounts"] });
			toast.success("Promo code created successfully");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error creating",
			),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<DiscountCode> }) =>
			marketingApi.updateDiscount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["discounts"] });
			toast.success("Promo code updated");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error updating",
			),
	});

	const deleteMutation = useMutation({
		mutationFn: marketingApi.deleteDiscount,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["discounts"] });
			toast.success("Promo code deleted");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error deleting",
			),
	});

	return {
		discounts,
		isLoading,
		error,
		createDiscount: createMutation.mutate,
		updateDiscount: updateMutation.mutate,
		deleteDiscount: deleteMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}
