import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "../api/notifications";

export function useNotifications(params?: {
	userId?: string;
	unread?: boolean;
	limit?: number;
}) {
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["notifications", JSON.stringify(params)],
		queryFn: () => notificationsApi.getNotifications(params),
		refetchInterval: 60 * 1000, // Refetch every 60 seconds
	});

	// Mark as read
	const markAsReadMutation = useMutation({
		mutationFn: notificationsApi.markAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error: any) => {
			toast.error("Error updating");
		},
	});

	// Mark all as read
	const markAllAsReadMutation = useMutation({
		mutationFn: notificationsApi.markAllAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			toast.success("All notifications marked as read");
		},
	});

	// Create notification
	const createNotificationMutation = useMutation({
		mutationFn: notificationsApi.createNotification,
		onError: (error: any) => {
			toast.error(
				error.response?.data?.error?.message ||
					"Error sending notification",
			);
		},
	});

	return {
		notifications: data?.notifications || [],
		unreadCount: data?.unreadCount || 0,
		isLoading,
		error,
		markAsRead: markAsReadMutation.mutate,
		markAllAsRead: markAllAsReadMutation.mutate,
		createNotification: createNotificationMutation.mutate,
		isCreatingNotification: createNotificationMutation.isPending,
	};
}
