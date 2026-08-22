import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployees'
import type { Employee, OcrResult } from '../../types'
import { format, parseISO } from 'date-fns'
import OcrUpload from './OcrUpload'

const dateStr = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'DD/MM/YYYY').optional().or(z.literal(''))
const EMPLOYEE_NUMBERS = Array.from({ length: 50 }, (_, i) => `EMP-${String(i + 1).padStart(3, '0')}`)

const schema = z.object({
  employeeNumber: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthdate: z.string().min(1, 'Required'),
  mobileNo: z.string().min(7, 'Required'),
  email: z.string().email('Invalid email'),
  passportNo: z.string().max(10, 'Max 10 characters').optional(),
  passportExpiry: dateStr,
  laborCardNo: z.string().max(9, 'Max 9 digits').optional(),
  laborCardExpiry: dateStr,
  eidNo: z.string()
    .refine(v => !v || v.replace(/-/g, '').length === 15, 'Must be 15 digits (XXX-XXXX-XXXXXXX-X)')
    .optional(),
  eidExpiry: dateStr,
  uidNo: z.string().max(15, 'Max 15 digits').optional(),
  fileNo: z.string()
    .refine(v => !v || /^\d{3}\/\d{4}\/\d{7}$/.test(v), 'Format: 202/2026/1234567')
    .optional(),
  visaExpiry: dateStr,
})
type FormData = z.infer<typeof schema>

function toDisplay(iso?: string | null): string {
  if (!iso) return ''
  try { return format(parseISO(iso), 'dd/MM/yyyy') } catch { return iso }
}

// ── EID mask: XXX-XXXX-XXXXXXX-X ─────────────────────────────────────────────
// Sections: 3 - 4 - 7 - 1 digits
function maskEid(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 15)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 7)
  const p3 = digits.slice(7, 14)
  const p4 = digits.slice(14, 15)
  let out = p1
  if (digits.length > 3) out += '-' + p2
  if (digits.length > 7) out += '-' + p3
  if (digits.length > 14) out += '-' + p4
  return out
}

// ── File No. mask: XXX/XXXX/XXXXXXX ─────────────────────────────────────────
// Sections: 3 / 4 / 7 digits
function maskFileNo(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 7)
  const p3 = digits.slice(7, 14)
  let out = p1
  if (digits.length > 3) out += '/' + p2
  if (digits.length > 7) out += '/' + p3
  return out
}

const Field = ({ label, error, children, required }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean
}) => (
  <div>
    <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
)

const input = "w-full px-3 py-2 text-base sm:text-sm text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"

export default function EmployeeForm({ employee, onCancel, onSuccess }: {
  employee?: Employee; onCancel: () => void; onSuccess: () => void
}) {
  const create = useCreateEmployee()
  const update = useUpdateEmployee(employee?.id ?? '')
  const isEditing = !!employee

  // Local display states for masked fields
  const [eidDisplay, setEidDisplay] = useState(employee?.eidNo ?? '')
  const [fileDisplay, setFileDisplay] = useState(employee?.fileNo ?? '')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee ? {
      ...employee,
      birthdate: toDisplay(employee.birthdate),
      passportExpiry: toDisplay(employee.passportExpiry),
      laborCardExpiry: toDisplay(employee.laborCardExpiry),
      eidExpiry: toDisplay(employee.eidExpiry),
      visaExpiry: toDisplay(employee.visaExpiry),
    } : { gender: 'MALE' },
  })

  // ── OCR auto-fill ──────────────────────────────────────────────────────────
  const handleOcrResult = (result: OcrResult) => {
    if (result.firstName)       setValue('firstName', result.firstName)
    if (result.lastName)        setValue('lastName', result.lastName)
    if (result.gender)          setValue('gender', result.gender)
    if (result.birthdate)       setValue('birthdate', result.birthdate)
    if (result.passportNo)      setValue('passportNo', result.passportNo.slice(0, 10))
    if (result.passportExpiry)  setValue('passportExpiry', result.passportExpiry)
    if (result.eidNo) {
      const masked = maskEid(result.eidNo)
      setEidDisplay(masked)
      setValue('eidNo', masked)
    }
    if (result.eidExpiry)       setValue('eidExpiry', result.eidExpiry)
    if (result.uidNo)           setValue('uidNo', result.uidNo.replace(/\D/g, '').slice(0, 15))
    if (result.laborCardNo)     setValue('laborCardNo', result.laborCardNo.replace(/\D/g, '').slice(0, 9))
    if (result.laborCardExpiry) setValue('laborCardExpiry', result.laborCardExpiry)
  }

  const onSubmit = async (data: FormData) => {
    if (isEditing) {
      await update.mutateAsync(data)
    } else {
      await create.mutateAsync(data)
    }
    onSuccess()
  }

  const isPending = create.isPending || update.isPending

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
          {isEditing ? 'Edit record' : 'Add employee'}
        </h1>
        <button onClick={onCancel} className="shrink-0 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">

        {/* ── OCR Upload ── */}
        <OcrUpload onExtracted={handleOcrResult} />

        {/* ── Personal details ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Personal details</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" error={errors.firstName?.message} required>
              <input {...register('firstName')} className={input} placeholder="Juan" />
            </Field>
            <Field label="Last name" error={errors.lastName?.message} required>
              <input {...register('lastName')} className={input} placeholder="Dela Cruz" />
            </Field>
            <Field label="Gender" error={errors.gender?.message} required>
              <select {...register('gender')} className={input}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Birthdate (DD/MM/YYYY)" error={errors.birthdate?.message} required>
              <input {...register('birthdate')} className={input} placeholder="01/01/1990" />
            </Field>
            <Field label="Mobile no." error={errors.mobileNo?.message} required>
              <input {...register('mobileNo')} className={input} placeholder="+971 50 000 0000" />
            </Field>
            <Field label="Email" error={errors.email?.message} required>
              <input {...register('email')} className={input} placeholder="name@company.ae" />
            </Field>
            <Field label="Designation" error={errors.designation?.message} required>
              <input {...register('designation')} className={input} placeholder="Software Engineer" />
            </Field>
            <Field label="Employee no." error={errors.employeeNumber?.message} required>
              <select
                {...register('employeeNumber')}
                className={input}
                disabled={isEditing}
                style={isEditing ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <option value="">Select…</option>
                {EMPLOYEE_NUMBERS.map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Document details ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Document details</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Passport — max 10 chars, alphanumeric */}
            <Field label="Passport #" error={errors.passportNo?.message}>
              <input
                {...register('passportNo')}
                className={input}
                placeholder="P1234567AB"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                  setValue('passportNo', val)
                  e.target.value = val
                }}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Max 10 characters</p>
            </Field>
            <Field label="Passport expiration (DD/MM/YYYY)" error={errors.passportExpiry?.message}>
              <input {...register('passportExpiry')} className={input} placeholder="01/01/2030" />
            </Field>

            {/* L.C No. — max 9 digits */}
            <Field label="L.C no." error={errors.laborCardNo?.message}>
              <input
                {...register('laborCardNo')}
                className={input}
                placeholder="123456789"
                maxLength={9}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                  setValue('laborCardNo', val)
                  e.target.value = val
                }}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Max 9 digits</p>
            </Field>
            <Field label="L.C expiration (DD/MM/YYYY)" error={errors.laborCardExpiry?.message}>
              <input {...register('laborCardExpiry')} className={input} placeholder="01/01/2026" />
            </Field>

            {/* EID — auto-masked XXX-XXXX-XXXXXXX-X */}
            <Field label="EID no." error={errors.eidNo?.message}>
              <input
                className={input}
                placeholder="784-1990-1234567-8"
                maxLength={18} // 15 digits + 3 dashes
                value={eidDisplay}
                onChange={(e) => {
                  const masked = maskEid(e.target.value)
                  setEidDisplay(masked)
                  setValue('eidNo', masked, { shouldValidate: true })
                }}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Format: XXX-XXXX-XXXXXXX-X</p>
            </Field>
            <Field label="EID expiration (DD/MM/YYYY)" error={errors.eidExpiry?.message}>
              <input {...register('eidExpiry')} className={input} placeholder="01/01/2027" />
            </Field>

            {/* UID — max 15 digits */}
            <Field label="UID no." error={errors.uidNo?.message}>
              <input
                {...register('uidNo')}
                className={input}
                placeholder="784199012345678"
                maxLength={15}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 15)
                  setValue('uidNo', val)
                  e.target.value = val
                }}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Max 15 digits</p>
            </Field>

            {/* File No. — auto-masked XXX/XXXX/XXXXXXX */}
            <Field label="File no." error={errors.fileNo?.message}>
              <input
                className={input}
                placeholder="202/2026/1234567"
                maxLength={16} // 14 digits + 2 slashes
                value={fileDisplay}
                onChange={(e) => {
                  const masked = maskFileNo(e.target.value)
                  setFileDisplay(masked)
                  setValue('fileNo', masked, { shouldValidate: true })
                }}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Format: 202/2026/1234567</p>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Visa expiration (DD/MM/YYYY)" error={errors.visaExpiry?.message}>
                <input {...register('visaExpiry')} className={input} placeholder="01/01/2026" />
              </Field>
            </div>
          </div>
        </div>

        {(create.error || update.error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
            {(create.error as any)?.response?.data?.error
              ?? (update.error as any)?.response?.data?.error
              ?? 'An error occurred. Please try again.'}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 sm:py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2.5 sm:py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 w-full sm:w-auto">
            {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create employee'}
          </button>
        </div>
      </form>
    </div>
  )
}