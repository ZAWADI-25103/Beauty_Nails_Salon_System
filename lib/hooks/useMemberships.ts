import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type Membership,
	type MembershipPurchase,
	membershipsApi,
} from "../api/memberships";

export function useMemberships() {
	const queryClient = useQueryClient();

	const {
		data: memberships = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["memberships"],
		queryFn: membershipsApi.getMemberships,
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	const createMutation = useMutation({
		mutationFn: membershipsApi.createMembership,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["memberships"] });
			toast.success("Membership created successfully");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error creating",
			),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Membership> }) =>
			membershipsApi.updateMembership(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["memberships"] });
			toast.success("Membership updated");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error updating",
			),
	});

	const deleteMutation = useMutation({
		mutationFn: membershipsApi.deleteMembership,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["memberships"] });
			toast.success("Membership deleted");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error deleting",
			),
	});

	return {
		memberships,
		isLoading,
		error,
		createMembership: createMutation.mutate,
		updateMembership: updateMutation.mutate,
		deleteMembership: deleteMutation.mutate,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}

export function useMembershipPurchases(params?: {
	clientId?: string;
	membershipId?: string;
}) {
	const queryClient = useQueryClient();

	const {
		data: purchases = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["membership-purchases", params],
		queryFn: () => membershipsApi.getPurchases(params),
		staleTime: 5 * 60 * 1000,
		gcTime: 1000 * 60 * 10,
		structuralSharing: true,
	});

	const purchaseMutation = useMutation({
		mutationFn: membershipsApi.purchaseMembership,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["membership-purchases"] });
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			toast.success("Membership purchased successfully");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error purchasing",
			),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<MembershipPurchase>;
		}) => membershipsApi.updatePurchase(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["membership-purchases"] });
			toast.success("Membership purchase updated");
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.error?.message || "Error updating",
			),
	});

	return {
		purchases,
		isLoading,
		error,
		purchaseMembership: purchaseMutation.mutate,
		updatePurchase: updateMutation.mutate,
		isPurchasing: purchaseMutation.isPending,
		isUpdating: updateMutation.isPending,
	};
}
