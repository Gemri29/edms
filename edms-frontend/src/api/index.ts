import api from './client'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
}

// ─── Employees ────────────────────────────────────────────────────────────────

export type EmployeeQuery = {
  page?: number
  limit?: number
  search?: string
  gender?: string
  designation?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  expiryStatus?: 'all' | 'expiring' | 'expired' | 'valid'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const employeeApi = {
  list: (params: EmployeeQuery) => api.get('/api/employees', { params }),
  get: (id: string) => api.get(`/api/employees/${id}`),
  create: (data: unknown) => api.post('/api/employees', data),
  update: (id: string, data: unknown) => api.put(`/api/employees/${id}`, data),
  archive: (id: string) => api.patch(`/api/employees/${id}/archive`),
  restore: (id: string) => api.patch(`/api/employees/${id}/restore`),
  delete: (id: string) => api.delete(`/api/employees/${id}`),
  auditLog: (id: string) => api.get(`/api/employees/${id}/audit`),
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const userApi = {
  list: () => api.get('/api/users'),
  create: (data: unknown) => api.post('/api/users', data),
  update: (id: string, data: unknown) => api.put(`/api/users/${id}`, data),
  deactivate: (id: string) => api.patch(`/api/users/${id}/deactivate`),
}

// ─── OCR ──────────────────────────────────────────────────────────────────────

export const ocrApi = {
  extract: (base64: string, mimeType: string, documentType: string) =>
    api.post('/api/ocr/extract', { base64, mimeType, documentType }),
}
