import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { toast } from 'sonner';

export function useNotifications(params?: {
  userId?: string;
  unread?: boolean;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getNotifications(params),
    refetchInterval: 240000, // Refetch every 4'
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });
  
  // Create notification
  const createNotificationMutation = useMutation({
    mutationFn: notificationsApi.createNotification,
    onSuccess: () => {
      // Optionally invalidate queries if needed, or just show a toast
      toast.success('Notification envoyée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erreur lors de l\'envoi de la notification');
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
