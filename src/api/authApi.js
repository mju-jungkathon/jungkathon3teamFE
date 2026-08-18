import { apiClient } from './axiosInstance';

export const authApi = {
  // 1.1 회원가입
  signup: async ({ email, password, nickname }) => {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      nickname,
    });
    return response.data;
  },

  // 1.2 로그인
  login: async ({ email, password }) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },

  // 1.4 로그아웃
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};