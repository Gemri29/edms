import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserX, UserCheck } from 'lucide-react'
import { usersApi } from '../api/users'
import { useAuthStore } from '../store/auth.store'
import { formatDate, getInitials } from '../lib/utils'
import type { User } from '../types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  temporaryPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
})
type FormData = z.infer<typeof schema>

const input = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"

export default function AccountsPage() {
  const me = useAuthStore((s) => s.user)
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data as User[]),
  })

  const deactivate = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const reactivate = useMutation({
    mutationFn: (id: string) => usersApi.update(id, { isActive: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const create = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false) },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ADMIN' },
  })

  const onSubmit = (data: FormData) => create.mutate(data)

  const users = data ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-medium text-slate-800">Account management</h1>
        <button onClick={() => { reset(); setShowModal(true) }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={13} /> New account
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr] bg-slate-50 border-b border-slate-200 px-4">
            {['Name', 'Email', 'Role', 'Status', 'Last login', 'Actions'].map((h) => (
              <div key={h} className="py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          {users.map((u) => (
            <div key={u.id} className={`grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr] px-4 border-b border-slate-100 last:border-b-0 items-center ${!u.isActive ? 'opacity-50' : ''}`}>
              <div className="py-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                  {getInitials(u.fullName)}
                </div>
                <span className="text-xs font-medium text-slate-800">{u.fullName}</span>
              </div>
              <div className="py-3 text-xs text-slate-400 truncate pr-2">{u.email}</div>
              <div className="py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <div className="py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="py-3 text-xs text-slate-400">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</div>
              <div className="py-3 flex gap-1.5">
                {u.id === me?.id ? (
                  <span className="text-[10px] text-slate-300 italic">You</span>
                ) : u.isActive ? (
                  <button onClick={() => deactivate.mutate(u.id)}
                    title="Deactivate"
                    className="text-slate-400 hover:text-red-500 transition-colors">
                    <UserX size={14} />
                  </button>
                ) : (
                  <button onClick={() => reactivate.mutate(u.id)}
                    title="Reactivate"
                    className="text-slate-400 hover:text-green-500 transition-colors">
                    <UserCheck size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Create new account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Full name</label>
                <input {...register('fullName')} className={input} placeholder="First and last name" />
                {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Email address</label>
                <input {...register('email')} className={input} placeholder="name@company.ae" />
                {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Role</label>
                <select {...register('role')} className={input}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Temporary password</label>
                <input {...register('temporaryPassword')} type="password" className={input} placeholder="Min 8 chars, uppercase, number, symbol" />
                {errors.temporaryPassword && <p className="text-[10px] text-red-500 mt-0.5">Must be 8+ chars with uppercase, number, and symbol</p>}
              </div>
              <p className="text-[10px] text-slate-400">User must change this password on first login.</p>
              {create.error && <p className="text-xs text-red-500">{(create.error as any)?.response?.data?.error}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={create.isPending}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
                  {create.isPending ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
