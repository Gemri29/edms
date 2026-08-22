import { useNavigate } from 'react-router-dom'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useEmployees, useRestoreEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { useAuthStore } from '../store/auth.store'
import { formatDate, getInitials } from '../lib/utils'

export default function ArchivePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const { data, isLoading } = useEmployees({ status: 'ARCHIVED', sortBy: 'lastName', sortOrder: 'asc' })
  const restore = useRestoreEmployee()
  const del = useDeleteEmployee()

  const employees = data?.data ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-medium text-slate-800">Archive</h1>
        <p className="text-xs text-slate-400">{employees.length} archived employees</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 flex gap-2 items-start">
        <span className="text-slate-400 text-xs mt-0.5"></span>
        <p className="text-xs text-slate-500 leading-relaxed">
          Archived employees are read-only and hidden from the dashboard. All history and audit logs are preserved.
          {isSuperAdmin ? ' As Super Admin, you can restore or permanently delete records.' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-slate-400">Loading…</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">No archived employees.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center px-4 py-3 border-b border-slate-100 last:border-b-0 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500 mr-3 flex-shrink-0">
                {getInitials(`${emp.firstName} ${emp.lastName}`)}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                <p className="text-sm font-medium text-slate-600">{emp.lastName}, {emp.firstName}</p>
                <p className="text-xs text-slate-400">{emp.employeeNumber} · {emp.designation}</p>
              </div>
              <div className="text-right mr-4 flex-shrink-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase">Archived</p>
                <p className="text-xs text-slate-400">{formatDate(emp.archivedAt)}</p>
              </div>
              {isSuperAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => restore.mutate(emp.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-green-200 text-green-700 hover:bg-green-50">
                    <RotateCcw size={11} /> Restore
                  </button>
                  <button onClick={() => del.mutate(emp.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
