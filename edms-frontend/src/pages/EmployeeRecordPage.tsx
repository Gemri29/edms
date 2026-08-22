import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Edit, Archive, RotateCcw, Trash2, Clock } from 'lucide-react'
import { useEmployee, useArchiveEmployee, useRestoreEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { useAuthStore } from '../store/auth.store'
import { formatDate, getInitials, getExpiryState, daysUntil, cn } from '../lib/utils'
import EmployeeForm from '../components/employee/EmployeeForm'

function FieldCell({ label, value, expiry }: { label: string; value?: string | null; expiry?: boolean }) {
  const state = expiry ? getExpiryState(value) : null
  const days = expiry ? daysUntil(value) : null

  return (
    <div className="px-4 py-3 border-b border-slate-100 last:border-b-0">
      <p className="text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      {!value ? (
        <p className="text-sm text-slate-400 italic">Not provided</p>
      ) : (
        <div>
          <p className={cn('text-sm font-NORMAL', {
            'text-slate-900': !state || state === 'valid',
            'text-orange-600': state === 'expiring',
            'text-red-600': state === 'expired',
          })}>
            {expiry ? formatDate(value) : value}
          </p>
          {state === 'expiring' && days !== null && (
            <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
              <Clock size={10} /> {days} days left
            </p>
          )}
          {state === 'expired' && days !== null && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <Clock size={10} /> Expired {Math.abs(days)} days ago
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{title}</p>
      </div>
      <div className="grid grid-cols-2">{children}</div>
    </div>
  )
}

// AED formatter for the salary section — matches the "AED" labels used in EmployeeForm
function formatAed(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return null
  return `AED ${num.toLocaleString('en-AE')}`
}

export default function EmployeeRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: emp, isLoading } = useEmployee(id!)
  const archive = useArchiveEmployee()
  const restore = useRestoreEmployee()
  const del = useDeleteEmployee()
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'info' | 'audit'>('info')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Loading…</div>
  if (!emp) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Employee not found.</div>

  // Edit mode — renders the full form (OCR upload is included there now)
  if (editing) return <EmployeeForm employee={emp} onCancel={() => setEditing(false)} onSuccess={() => setEditing(false)} />

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // The generated Employee type may not have caught up with the new salary
  // columns yet (see note below) — cast defensively like EmployeeForm.tsx does.
  const empWithSalary = emp as typeof emp & {
    designationEid?: string | null
    basicSalary?: number | string | null
    housingSalary?: number | string | null
    transpoAllowance?: number | string | null
    totalSalary?: number | string | null
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Link to="/" className="text-slate-600 hover:text-slate-900 font-medium">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-slate-400">{emp.lastName}, {emp.firstName}</span>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-base font-bold text-slate-700 flex-shrink-0">
          {getInitials(`${emp.firstName} ${emp.lastName}`)}
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-slate-900">{emp.lastName}, {emp.firstName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{emp.employeeNumber} · {emp.designation}</p>
          <div className="flex gap-1.5 mt-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{emp.gender}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {emp.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {emp.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => archive.mutate(emp.id, { onSuccess: () => navigate('/') })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <Archive size={12} /> Archive
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                <Edit size={12} /> Edit record
              </button>
            </>
          )}
          {emp.status === 'ARCHIVED' && isSuperAdmin && (
            <>
              <button
                onClick={() => restore.mutate(emp.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-green-300 text-green-700 hover:bg-green-50"
              >
                <RotateCcw size={12} /> Restore
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        {(['info', 'audit'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}>
            {t === 'info' ? 'Info' : 'Audit log'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="flex flex-col gap-4">
          <SectionCard title="Personal details">
            <FieldCell label="First name" value={emp.firstName} />
            <FieldCell label="Last name" value={emp.lastName} />
            <FieldCell label="Gender" value={emp.gender} />
            <FieldCell label="Birthdate" value={formatDate(emp.birthdate)} />
            <FieldCell label="Mobile no." value={emp.mobileNo} />
            <FieldCell label="Email" value={emp.email} />
            <FieldCell label="Designation" value={emp.designation} />
            <FieldCell label="Designation according to EID" value={empWithSalary.designationEid} />
            <FieldCell label="Employee no." value={emp.employeeNumber} />
          </SectionCard>

          <SectionCard title="Document details">
            <FieldCell label="Passport #" value={emp.passportNo} />
            <FieldCell label="Passport expiration" value={emp.passportExpiry} expiry />
            <FieldCell label="L.C no." value={emp.laborCardNo} />
            <FieldCell label="L.C expiration" value={emp.laborCardExpiry} expiry />
            <FieldCell label="EID no." value={emp.eidNo} />
            <FieldCell label="EID expiration" value={emp.eidExpiry} expiry />
            <FieldCell label="UID no." value={emp.uidNo} />
            <FieldCell label="File no." value={emp.fileNo} />
            <div className="col-span-2">
              <FieldCell label="Visa expiration" value={emp.visaExpiry} expiry />
            </div>
          </SectionCard>

          <SectionCard title="Salary details">
            <FieldCell label="Basic salary" value={formatAed(empWithSalary.basicSalary)} />
            <FieldCell label="Housing salary" value={formatAed(empWithSalary.housingSalary)} />
            <FieldCell label="Transportation allowance" value={formatAed(empWithSalary.transpoAllowance)} />
            <FieldCell label="Total salary" value={formatAed(empWithSalary.totalSalary)} />
          </SectionCard>

          {/* Edit record button hint — OCR is inside the edit form */}
          {emp.status === 'ACTIVE' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-slate-600">Need to upload an ID for auto-fill?</p>
              <button onClick={() => setEditing(true)}
                className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1">
                <Edit size={11} /> Open edit form
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {!emp.auditLogs || emp.auditLogs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">No audit history yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emp.auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.action === 'CREATE' ? 'bg-green-500' :
                    log.action === 'UPDATE' ? 'bg-blue-500' :
                    log.action === 'ARCHIVE' ? 'bg-orange-400' :
                    'bg-slate-300'
                  }`} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">
                      <span className="font-bold">{log.changedBy.fullName}</span>{' '}
                      {log.action.toLowerCase()}d this record
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.changedAt)}</p>
                    {log.previousValue && Object.keys(log.previousValue).length > 0 && (
                      <div className="mt-1.5 bg-slate-100 rounded px-2 py-1.5 text-[10px] text-slate-600 font-mono leading-relaxed">
                        {Object.entries(log.previousValue).map(([k, v]: [string, any]) => (
                          <div key={k}>
                            <span className="text-slate-500">{k}:</span>{' '}
                            <span className="text-red-500 line-through">{String(v?.from ?? v)}</span>
                            {' → '}
                            <span className="text-green-600">{String(v?.to ?? (log.newValue as any)?.[k] ?? '—')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Permanently delete this record?</h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This cannot be undone. All data for <strong>{emp.firstName} {emp.lastName}</strong> will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => del.mutate(emp.id, { onSuccess: () => navigate('/') })}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">
                {del.isPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}