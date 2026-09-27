import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowUpAZ, ArrowDownAZ, Plus, ChevronRight, X } from 'lucide-react'
import { useEmployees } from '../hooks/useEmployees'
import { getRowBg, getEmployeeExpiryState, getInitials, formatDate, daysUntil } from '../lib/utils'
import { EXPIRY_FIELDS } from '../types'
import type { Employee, EmployeeFilters } from '../types'
import NotificationBell from '../components/layout/NotificationBell'

const DEFAULT_FILTERS: EmployeeFilters = {
  status: 'ACTIVE',
  sortBy: 'lastName',
  sortOrder: 'asc',
  page: 1,
}

// Sorted worst-first (expired, then expiring, then valid) so that when a
// `limit` is applied (mobile view), the single badge kept is always the
// most urgent one -- not just whichever document field happens first in
// EXPIRY_FIELDS.
const STATE_PRIORITY = { expired: 0, expiring: 1, valid: 2 } as const

type Badge = {
  label: string
  days: number
  state: keyof typeof STATE_PRIORITY
}

function getSortedBadges(emp: Employee): Badge[] {
  return EXPIRY_FIELDS.flatMap(({ key, label }): Badge[] => {
    const val = emp[key] as string | undefined
    if (!val) return []
    const days = daysUntil(val)
    if (days === null) return []
    if (days < 0) return [{ label, days, state: 'expired' }]
    if (days <= 180) return [{ label, days, state: 'expiring' }]
    return [{ label, days, state: 'valid' }]
  }).sort((a, b) => STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state])
}

// limit is optional: omitted (desktop) shows every expiring/expired/valid
// document instead of an arbitrary cap; passing limit=1 (mobile) shows only
// the single most urgent one, and shows nothing at all if every document is
// simply valid -- keeping the compact mobile row free of clutter when there's
// nothing that actually needs attention.
function ExpiryBadges({ emp, limit }: { emp: Employee; limit?: number }) {
  const allBadges = getSortedBadges(emp)
  const badges = typeof limit === 'number' ? allBadges.slice(0, limit) : allBadges

  if (badges.length === 0) {
    if (typeof limit === 'number') return null // mobile: nothing urgent, show nothing
    return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">All docs valid</span>
  }

  // Mobile (limit=1): if the single most urgent document is still just
  // "valid", there's nothing worth surfacing below the employee number.
  if (typeof limit === 'number' && badges[0].state === 'valid') return null

  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.map((b, i) => (
        <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          b.state === 'expired' ? 'bg-red-50 text-red-600' :
          b.state === 'expiring' ? 'bg-orange-50 text-orange-600' :
          'bg-green-50 text-green-700'
        }`}>
          {b.label} {b.state === 'expired' ? `expired ${Math.abs(b.days)}d ago` : `${b.days}d left`}
        </span>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<EmployeeFilters>(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useEmployees(filters)

  // Close the filter dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSort = () => setFilters((f) => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
  }

  const sortByEmployeeNumber = filters.sortBy === 'employeeNumber'
  const expiringOnly = filters.expiryStatus === 'expiring'
  const activeFilterCount = [sortByEmployeeNumber, expiringOnly].filter(Boolean).length

  const toggleEmployeeNumberSort = (checked: boolean) => {
    setFilters((f) => ({
      ...f,
      sortBy: checked ? 'employeeNumber' : 'lastName',
      sortOrder: 'asc',
      page: 1,
    }))
  }

  const toggleExpiringOnly = (checked: boolean) => {
    setFilters((f) => ({
      ...f,
      expiryStatus: checked ? 'expiring' : 'all',
      page: 1,
    }))
  }

  const clearAllFilters = () => {
    setFilters((f) => ({
      ...f,
      sortBy: 'lastName',
      sortOrder: 'asc',
      expiryStatus: 'all',
      page: 1,
    }))
  }

  const employees = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterMenuRef}>
          <button
            onClick={() => setFilterMenuOpen((open) => !open)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={13} /> <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="p-3 flex flex-col gap-1">
                <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sortByEmployeeNumber}
                    onChange={(e) => toggleEmployeeNumberSort(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm text-slate-700">Employee number (ascending)</span>
                </label>

                <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiringOnly}
                    onChange={(e) => toggleExpiringOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm text-slate-700">Expiring soon</span>
                </label>
              </div>

              <div className="border-t border-slate-100 p-2">
                <button
                  onClick={clearAllFilters}
                  disabled={activeFilterCount === 0}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <X size={12} /> Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleSort}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-900 bg-slate-900 text-white"
        >
          {filters.sortOrder === 'asc' ? <ArrowUpAZ size={13} /> : <ArrowDownAZ size={13} />}
          <span className="hidden sm:inline">{filters.sortOrder === 'asc' ? 'A–Z' : 'Z–A'}</span>
        </button>
        <button
          onClick={() => navigate('/employees/new')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Plus size={13} /> <span className="hidden sm:inline">Add employee</span>
        </button>
        <NotificationBell />
      </div>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-medium !text-black">All employees</h1>
          <p className="text-xs text-slate-400">
            {pagination?.total ?? 0} total
          </p>
        </div>

        {/* Legend — hidden on mobile, where the row itself only shows a badge when something's actually urgent */}
        <div className="hidden sm:flex gap-4 mb-3">
          {[
            { bg: 'bg-red-50 border-red-200', label: 'Expired' },
            { bg: 'bg-orange-50 border-orange-200', label: 'Expiring soon' },
            { bg: 'bg-white border-slate-200', label: 'Active' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${l.bg}`} />
              <span className="text-[11px] text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Employee list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">No employees found.</div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${getRowBg(emp)}`}
              >
                {/* Desktop row: avatar, name/no./designation, ALL expiry badges, chevron */}
                <div className="hidden sm:flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 ${
                    getEmployeeExpiryState(emp) === 'expired' ? 'bg-red-100 text-red-700' :
                    getEmployeeExpiryState(emp) === 'expiring' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {getInitials(`${emp.firstName} ${emp.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{emp.lastName}, {emp.firstName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{emp.employeeNumber} · {emp.designation}</p>
                  </div>
                  <div className="mx-4">
                    <ExpiryBadges emp={emp} />
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                </div>

                {/* Mobile row: stacked -- name, then employee no./designation,
                    then (only if something's actually urgent) a single badge */}
                <div className="flex sm:hidden items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    getEmployeeExpiryState(emp) === 'expired' ? 'bg-red-100 text-red-700' :
                    getEmployeeExpiryState(emp) === 'expiring' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {getInitials(`${emp.firstName} ${emp.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{emp.lastName}, {emp.firstName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{emp.employeeNumber} · {emp.designation}</p>
                    <div className="mt-1">
                      <ExpiryBadges emp={emp} limit={1} />
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50"
            >‹</button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p}
                onClick={() => setFilters((f) => ({ ...f, page: p }))}
                className={`w-7 h-7 rounded-lg border text-xs font-medium ${
                  filters.page === p
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >{p}</button>
            ))}
            <button
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50"
            >›</button>
          </div>
        )}
      </div>
    </div>
  )
}