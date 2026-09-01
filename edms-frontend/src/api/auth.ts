import api from '../lib/axios'
import type { ApiResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; mustChangePw: boolean }>>('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get<ApiResponse<{ user: User }>>('/api/auth/me'),
  updateProfile: (data: { fullName?: string; email?: string }) =>
    api.put<ApiResponse<{ user: User }>>('/api/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<null>>('/api/auth/change-password', data),
}