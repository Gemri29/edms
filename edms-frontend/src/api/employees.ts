import api from '../lib/axios'
import type { Employee, EmployeeFilters, PaginatedResponse, ApiResponse } from '../types'

export const employeesApi = {
  list: (filters: EmployeeFilters = {}) =>
    api.get<PaginatedResponse<Employee>>('/api/employees', { params: filters }),

  get: (id: string) =>
    api.get<ApiResponse<Employee>>(`/api/employees/${id}`),

  create: (data: Partial<Employee>) =>
    api.post<ApiResponse<Employee>>('/api/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/api/employees/${id}`, data),

  archive: (id: string) =>
    api.patch<ApiResponse<Employee>>(`/api/employees/${id}/archive`),

  restore: (id: string) =>
    api.patch<ApiResponse<Employee>>(`/api/employees/${id}/restore`),

  delete: (id: string) =>
    api.delete(`/api/employees/${id}`),

  auditLog: (id: string) =>
    api.get<ApiResponse<Employee['auditLogs']>>(`/api/employees/${id}/audit`),
}
