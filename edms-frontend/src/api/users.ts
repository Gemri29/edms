import api from '../lib/axios'
import type { User, ApiResponse } from '../types'

export const usersApi = {
  list: () => api.get<ApiResponse<User[]>>('/api/users'),
  create: (data: { email: string; fullName: string; role: string; temporaryPassword: string }) =>
    api.post<ApiResponse<User>>('/api/users', data),
  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/api/users/${id}`, data),
  deactivate: (id: string) =>
    api.patch<ApiResponse<User>>(`/api/users/${id}/deactivate`),
}
