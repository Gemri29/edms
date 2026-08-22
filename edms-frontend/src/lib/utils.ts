import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, parseISO } from 'date-fns'
import { EXPIRY_FIELDS, type Employee } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd/MM/yyyy') }
  catch { return '—' }
}

export function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  try { return differenceInDays(parseISO(dateStr), new Date()) }
  catch { return null }
}

export type ExpiryState = 'expired' | 'expiring' | 'valid' | null

export function getExpiryState(dateStr?: string | null): ExpiryState {
  const days = daysUntil(dateStr)
  if (days === null) return null
  if (days < 0) return 'expired'
  if (days <= 180) return 'expiring'
  return 'valid'
}

export function getEmployeeExpiryState(emp: Employee): ExpiryState {
  let worst: ExpiryState = null
  for (const { key } of EXPIRY_FIELDS) {
    const state = getExpiryState(emp[key] as string | undefined)
    if (state === 'expired') return 'expired'
    if (state === 'expiring') worst = 'expiring'
  }
  return worst
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getRowBg(emp: Employee): string {
  const state = getEmployeeExpiryState(emp)
  if (state === 'expired') return 'bg-red-50 hover:bg-red-100'
  if (state === 'expiring') return 'bg-orange-50 hover:bg-orange-100'
  return 'hover:bg-slate-50'
}
