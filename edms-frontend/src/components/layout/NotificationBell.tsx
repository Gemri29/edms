import { Bell } from 'lucide-react'
import { useEmployees } from '../../hooks/useEmployees'
import { getExpiryState, daysUntil } from '../../lib/utils'
import type { Employee } from '../../types'
import { EXPIRY_FIELDS } from '../../types'

interface Alert { emp: Employee; label: string; expiry: string; state: 'expired' | 'expiring' }

export default function NotificationBell() {
  const { data } = useEmployees({ status: 'ACTIVE', expiryStatus: 'expiring', limit: 100 })
  const { data: expiredData } = useEmployees({ status: 'ACTIVE', expiryStatus: 'expired', limit: 100 })

  const alerts: Alert[] = []

  const process = (employees: Employee[], state: 'expired' | 'expiring') => {
    for (const emp of employees) {
      for (const { key, label } of EXPIRY_FIELDS) {
        const val = emp[key] as string | undefined
        const s = getExpiryState(val)
        if (s === state) alerts.push({ emp, label, expiry: val!, state })
      }
    }
  }

  if (expiredData?.data) process(expiredData.data, 'expired')
  if (data?.data) process(data.data, 'expiring')

  return (
    <div className="relative group">
      {/* Bell button */}
      <button className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
        <Bell size={16} />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {/* Dropdown — hover controlled via Tailwind group */}
      <div className="
        absolute right-0 top-[calc(100%+6px)] w-80
        bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden
        opacity-0 invisible translate-y-1
        group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
        transition-all duration-150 ease-out
      ">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800">Document alerts</span>
          {alerts.length > 0 && (
            <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {alerts.length} need attention
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">All documents are up to date ✓</div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {alerts.map((a, i) => {
              const days = daysUntil(a.expiry)
              return (
                <div key={i} className="px-4 py-3 flex gap-3 hover:bg-slate-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.state === 'expired' ? 'bg-red-500' : 'bg-orange-400'}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{a.emp.lastName}, {a.emp.firstName}</p>
                    <p className="text-xs text-slate-500">{a.label} · {a.emp.employeeNumber}</p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      a.state === 'expired' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {a.state === 'expired' ? `Expired ${Math.abs(days!)} days ago` : `${days} days left`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
