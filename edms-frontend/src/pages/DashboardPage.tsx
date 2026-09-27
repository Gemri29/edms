import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowUpAZ, ArrowDownAZ, Plus, ChevronRight, X, Menu } from 'lucide-react'
import { useEmployees } from '../hooks/useEmployees'
import { getRowBg, getEmployeeExpiryState, getInitials, formatDate, daysUntil } from '../lib/utils'
import { EXPIRY_FIELDS } from '../types'
import type { Employee, EmployeeFilters } from '../types'
import NotificationBell from '../components/layout/NotificationBell'
import Sidebar from '../components/layout/Sidebar'

const DEFAULT_FILTERS: EmployeeFilters = {
  status: 'ACTIVE',
  sortBy: 'lastName',
  sortOrder: 'asc',
  page: 1,
}

function ExpiryBadges({ emp, maxBadges }: { emp: Employee; maxBadges?: number }) {
  const badges = EXPIRY_FIELDS
    .flatMap(({ key, label }): Array<{
      label: string
      days: number
      state: 'expired' | 'expiring' | 'valid'
      key: keyof Employee
    }> => {
      const val = emp[key] as string | undefined
      if (!val) return []
      const days = daysUntil(val)
      if (days === null) return []
      if (days < 0) return [{ label, days, state: 'expired' as const, key }]
      if (days <= 180) return [{ label, days, state: 'expiring' as const, key }]
      return [{ label, days, state: 'valid' as const, key }]
    })
    .filter((b) => b.state !== 'valid')       // only show docs that need attention
    .sort((a, b) => a.days - b.days)          // most urgent first (expired < expiring)
    .slice(0, maxBadges ?? Infinity)          // limit only when maxBadges is passed

  if (badges.length === 0)
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
        All docs valid
      </span>
    )

  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            b.state === 'expired'
              ? 'bg-red-50 text-red-600'
              : 'bg-orange-50 text-orange-600'
          }`}
        >
          {b.label}{' '}
          {b.state === 'expired'
            ? `exp. ${formatDate(emp[b.key] as string)}`
            : `${b.days}d left`}
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
  const [menuOpen, setMenuOpen] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useEmployees(filters)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSort = () =>
    setFilters((f) => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))

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

      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className="sm:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
          >
            <Menu size={18} />
          </button>

          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by name, employee no., or designation…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
            />
          </div>

          <NotificationBell />
        </div>

        {/* Row 2: action buttons — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">

          {/* Filter dropdown */}
          <div className="relative flex-shrink-0" ref={filterMenuRef}>
            <button
              onClick={() => setFilterMenuOpen((open) => !open)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeFilterCount > 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={13} /> Filter
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
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
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-900 bg-slate-900 text-white"
          >
            {filters.sortOrder === 'asc' ? <ArrowUpAZ size={13} /> : <ArrowDownAZ size={13} />}
            {filters.sortOrder === 'asc' ? 'A–Z' : 'Z–A'}
          </button>

          <button
            onClick={() => navigate('/employees/new')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Plus size={13} /> Add employee
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-medium text-slate-900">All employees</h1>
          <p className="text-xs text-slate-400">{pagination?.total ?? 0} total</p>
        </div>

        {/* Legend */}
        <div className="flex gap-3 sm:gap-4 mb-3">
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
                className={`flex items-center px-3 sm:px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${getRowBg(emp)}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 ${
                  getEmployeeExpiryState(emp) === 'expired' ? 'bg-red-100 text-red-700' :
                  getEmployeeExpiryState(emp) === 'expiring' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {getInitials(`${emp.firstName} ${emp.lastName}`)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {emp.lastName}, {emp.firstName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {emp.employeeNumber} · {emp.designation}
                  </p>
                  {/* Mobile: single most urgent badge below subtitle */}
                  <div className="mt-1.5 sm:hidden">
                    <ExpiryBadges emp={emp} maxBadges={1} />
                  </div>
                </div>

                {/* Desktop: all urgent badges inline */}
                <div className="hidden sm:block mx-4 flex-shrink-0">
                  <ExpiryBadges emp={emp} />
                </div>

                <ChevronRight size={14} className="text-slate-300 flex-shrink-0 ml-1" />
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
              <button
                key={p}
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

      {/* ── Mobile slide-in sidebar ── */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full z-50 sm:hidden">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-[-40px] w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 shadow"
            >
              <X size={16} />
            </button>
            <Sidebar />
          </div>
        </>
      )}
    </div>
  )
}