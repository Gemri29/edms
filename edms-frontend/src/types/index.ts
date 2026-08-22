export type Role = 'ADMIN' | 'SUPER_ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type EmployeeStatus = 'ACTIVE' | 'ARCHIVED'
export type DocumentType = 'PASSPORT' | 'EMIRATES_ID' | 'LABOR_CARD'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface Employee {
  id: string
  employeeNumber: string
  designation: string
  lastName: string
  firstName: string
  gender: Gender
  birthdate: string
  mobileNo: string
  email: string
  passportNo?: string
  passportExpiry?: string
  laborCardNo?: string
  laborCardExpiry?: string
  eidNo?: string
  eidExpiry?: string
  uidNo?: string
  fileNo?: string
  visaExpiry?: string
  status: EmployeeStatus
  createdAt: string
  updatedAt: string
  archivedAt?: string
  createdBy?: { id: string; fullName: string }
  updatedBy?: { id: string; fullName: string }
  auditLogs?: AuditLog[]
}

export interface AuditLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE'
  changedAt: string
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  changedBy: { id: string; fullName: string }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export type ExpiryStatus = 'all' | 'expiring' | 'expired' | 'valid'
export type SortField = 'lastName' | 'firstName' | 'employeeNumber' | 'designation' | 'visaExpiry' | 'passportExpiry' | 'eidExpiry' | 'laborCardExpiry' | 'createdAt'
export type SortOrder = 'asc' | 'desc'

export interface EmployeeFilters {
  search?: string
  gender?: Gender
  designation?: string
  status?: EmployeeStatus
  expiryStatus?: ExpiryStatus
  sortBy?: SortField
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

export interface OcrResult {
  firstName?: string
  lastName?: string
  gender?: Gender
  birthdate?: string
  passportNo?: string
  passportExpiry?: string
  eidNo?: string
  eidExpiry?: string
  uidNo?: string
  laborCardNo?: string
  laborCardExpiry?: string
}

export const EXPIRY_FIELDS: { key: keyof Employee; label: string }[] = [
  { key: 'passportExpiry', label: 'Passport' },
  { key: 'laborCardExpiry', label: 'Labor Card' },
  { key: 'eidExpiry', label: 'Emirates ID' },
  { key: 'visaExpiry', label: 'Visa' },
]
