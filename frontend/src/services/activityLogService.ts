import api from './api';
import type {
  ActivityLog,
  ActivityLogFilterParams,
  ActivityLogPaginationMeta,
  ActivityLogUser,
} from '@/types/activityLog';

export const activityLogService = {
  async getLogs(params: ActivityLogFilterParams = {}): Promise<{
    data: ActivityLog[];
    meta: ActivityLogPaginationMeta;
  }> {
    const res = await api.get('/activity-logs', { params });
    return res.data;
  },

  async getLogDetail(id: number): Promise<ActivityLog> {
    const res = await api.get(`/activity-logs/${id}`);
    return res.data.data;
  },

  async getModules(): Promise<string[]> {
    const res = await api.get('/activity-logs/modules');
    return res.data.data || [];
  },

  async getActions(): Promise<string[]> {
    const res = await api.get('/activity-logs/actions');
    return res.data.data || [];
  },

  async getUsers(): Promise<ActivityLogUser[]> {
    const res = await api.get('/activity-logs/users');
    return res.data.data || [];
  },
};
