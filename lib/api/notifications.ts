import axiosdb from '../axios';

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled' | 'payment_received' | 'loyalty_reward' | 'marketing' | 'system' | 'birthday';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationData {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
}

export const notificationsApi = {
  // Get notifications
  getNotifications: async (params?: {
    userId?: string;
    unread?: boolean;
    limit?: number;
  }): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> => {
    const { data } = await axiosdb.get('/notifications', { params });
    return data;
  },

  // Mark as read
  markAsRead: async (id: string): Promise<{ message: string }> => {
    const { data } = await axiosdb.put(`/notifications/${id}/read`);
    return data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ message: string }> => {
    const { data } = await axiosdb.put('/notifications/mark-all-read');
    return data;
  },

  // Create a new notification
  createNotification: async (notificationData: CreateNotificationData): Promise<Notification> => {
    const { data } = await axiosdb.post('/notifications', notificationData);
    return data;
  },
};
