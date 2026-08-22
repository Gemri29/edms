import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Archive, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useLogout } from '../../hooks/useAuth'
import { getInitials } from '../../lib/utils'

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [showConfirm, setShowConfirm] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const navItem = (to: string, label: string, Icon: React.ElementType) => (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  return (
    <>
      <aside
        className={`${
          collapsed ? 'w-[56px] min-w-[56px]' : 'w-[200px] min-w-[200px]'
        } border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 transition-all duration-200 ease-in-out`}
      >
        {/* Logo + collapse toggle */}
        <div className={`px-4 py-4 border-b border-slate-200 flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">E</span>
          </div>
          {!collapsed && <span className="text-sm font-semibold text-slate-900 flex-1">EDMS</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 flex flex-col gap-0.5">
          {!collapsed && (
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">Main</p>
          )}
          {collapsed && <div className="pt-2" />}
          {navItem('/', 'Dashboard', LayoutDashboard)}
          {navItem('/archive', 'Archive', Archive)}

          {user?.role === 'SUPER_ADMIN' && (
            <>
              {!collapsed && (
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pt-4 pb-1">Super Admin</p>
              )}
              {collapsed && <div className="pt-2" />}
              {navItem('/accounts', 'Accounts', Users)}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-2 border-t border-slate-200">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${collapsed ? 'justify-center flex-col px-2' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">
              {user ? getInitials(user.fullName) : '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
              </div>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Sign out confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xs p-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 mx-auto mb-4">
              <LogOut size={18} className="text-slate-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 text-center mb-1">Sign out?</h2>
            <p className="text-xs text-slate-500 text-center mb-5">
              You'll be returned to the login page.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}