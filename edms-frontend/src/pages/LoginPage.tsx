import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck, UserCheck, Lock } from 'lucide-react'
import { useLogin } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const login = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => login.mutate(data)

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — hidden on mobile, shown from md up */}
      <div className="hidden md:flex md:w-64 shrink-0 bg-slate-900 flex-col items-center justify-center p-8 gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
            <span className="text-white text-lg font-bold">E</span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-base">EDMS</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">Employee Document<br/>Management System</p>
          </div>
        </div>
        <div className="w-full h-px bg-slate-700" />
        <div className="flex flex-col gap-4 w-full">
          {[
            { icon: Lock, text: 'Internal use only. Access restricted to authorized administrators.' },
            { icon: UserCheck, text: 'Accounts are created by a Super Admin only.' },
            { icon: ShieldCheck, text: 'All sessions are encrypted and logged.' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-8 sm:py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-lg sm:text-xl font-semibold !text-black mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@company.ae"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 sm:py-2 pr-10 text-base sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {login.error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600">
                Invalid email or password. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 flex gap-2 items-start bg-slate-100 rounded-lg px-3 py-2.5">
            <Lock size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500">5 failed attempts will lock your account for 15 minutes.</p>
          </div>
        </div>
      </div>
    </div>
  )
}