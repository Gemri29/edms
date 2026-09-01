import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useUpdateProfile, useChangePassword } from '../hooks/useAuth'
import { getInitials } from '../lib/utils'

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ── Shared components ─────────────────────────────────────────────────────────

const Field = ({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) => (
  <div>
    <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
  </div>
)

const input = "w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border ${
      type === 'success'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {type === 'success'
        ? <CheckCircle size={13} className="flex-shrink-0" />
        : <AlertCircle size={13} className="flex-shrink-0" />}
      {message}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileMsg(null)
    try {
      await updateProfile.mutateAsync(data)
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' })
    } catch (err: any) {
      setProfileMsg({
        text: err?.response?.data?.error ?? 'Failed to update profile.',
        type: 'error',
      })
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordMsg(null)
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setPasswordMsg({ text: 'Password changed successfully.', type: 'success' })
      passwordForm.reset()
    } catch (err: any) {
      setPasswordMsg({
        text: err?.response?.data?.error ?? 'Failed to change password.',
        type: 'error',
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <h1 className="text-base font-semibold text-slate-900 mb-6">Settings</h1>

      {/* ── Profile section ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <User size={13} className="text-slate-500" />
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Profile</p>
        </div>

        <div className="p-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-base font-bold text-slate-600 flex-shrink-0">
              {user ? getInitials(user.fullName) : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
            <Field label="Full name" error={profileForm.formState.errors.fullName?.message}>
              <input {...profileForm.register('fullName')} className={input} placeholder="Your full name" />
            </Field>
            <Field label="Email address" error={profileForm.formState.errors.email?.message}>
              <input {...profileForm.register('email')} className={input} placeholder="name@company.ae" />
            </Field>

            {profileMsg && <Toast message={profileMsg.text} type={profileMsg.type} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {updateProfile.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Password section ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Lock size={13} className="text-slate-500" />
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Change password</p>
        </div>

        <div className="p-5">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
              <div className="relative">
                <input
                  {...passwordForm.register('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  className={input + ' pr-10'}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            <Field label="New password" error={passwordForm.formState.errors.newPassword?.message}>
              <div className="relative">
                <input
                  {...passwordForm.register('newPassword')}
                  type={showNew ? 'text' : 'password'}
                  className={input + ' pr-10'}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Min 8 chars · uppercase · number · special character</p>
            </Field>

            <Field label="Confirm new password" error={passwordForm.formState.errors.confirmPassword?.message}>
              <div className="relative">
                <input
                  {...passwordForm.register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  className={input + ' pr-10'}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            {passwordMsg && <Toast message={passwordMsg.text} type={passwordMsg.type} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}