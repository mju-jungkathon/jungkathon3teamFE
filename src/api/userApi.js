import { apiClient } from './axiosInstance';

export const userApi = {
  // 7.1 프로필 전체 조회
  getProfile: async () => {
    const response = await apiClient.get('/users/me/profile');
    return response.data;
  },

  // 7.2 목표 수정
  updateGoal: async ({ goalType, weeklyRunGoal }) => {
    const response = await apiClient.patch('/users/me/goal', {
      goalType,
      weeklyRunGoal,
    });
    return response.data;
  },

  // 7.3 연동/권한 상태 조회
  getIntegrations: async () => {
    const response = await apiClient.get('/users/me/integrations');
    return response.data;
  },

  // 7.4 알림 설정 변경
  updateNotifications: async ({ runningReminderTime, weeklyReportDay, weeklyReportTime }) => {
    const response = await apiClient.patch('/users/me/notifications', {
      runningReminderTime,
      weeklyReportDay,
      weeklyReportTime,
    });
    return response.data;
  },
};