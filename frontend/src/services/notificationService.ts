import api from './api';
import type { SystemNotification } from '@/types/activityLog';

export const notificationService = {
  async getNotifications(params: { status?: 'unread' | 'all'; limit?: number } = {}): Promise<{
    data: SystemNotification[];
    unread_count: number;
  }> {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data?.unread_count ?? 0;
  },

  async markAsRead(id: number): Promise<number> {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data?.unread_count ?? 0;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },

  async deleteNotification(id: number): Promise<number> {
    const res = await api.delete(`/notifications/${id}`);
    return res.data?.unread_count ?? 0;
  },
};
