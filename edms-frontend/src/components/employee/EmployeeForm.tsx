import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEmployee, useUpdateEmployee, useEmployees } from '../../hooks/useEmployees'
import type { Employee, OcrResult } from '../../types'
import { format, parseISO } from 'date-fns'
import OcrUpload from './OcrUpload'

const dateStr = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'DD/MM/YYYY').optional().or(z.literal(''))
const salaryStr = z.string().regex(/^\d{0,10}$/, 'Max 10 digits').optional().or(z.literal(''))
const EMPLOYEE_NUMBERS = Array.from({ length: 50 }, (_, i) => `EMP-${String(i + 1).padStart(3, '0')}`)

const schema = z.object({
  employeeNumber: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  designationEid: z.string().optional(),
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
  basicSalary: salaryStr,
  housingSalary: salaryStr,
  transpoAllowance: salaryStr,
  totalSalary: salaryStr,
})
type FormData = z.infer<typeof schema>

function toDisplay(iso?: string | null): string {
  if (!iso) return ''
  try { return format(parseISO(iso), 'dd/MM/yyyy') } catch { return iso }
}

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

const Field = ({ label, error, children, required, hint }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean; hint?: string
}) => (
  <div>
    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${error ? 'text-red-600' : 'text-slate-700'}`}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
)

// Base classes shared by every input/select, split so error state can swap
// just the border/ring/background instead of duplicating the whole string.
const inputBase = "w-full px-3 py-2 text-base sm:text-sm text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 bg-white border"
const inputValidState = "border-slate-300 focus:ring-slate-900"
const inputErrorState = "border-red-400 bg-red-50 focus:ring-red-400"

// hasError -> red border/ring + tinted background, on top of the existing
// inline error message below the field. Keeps errors visible at a glance on
// a long form instead of relying on small red text alone.
const inputClass = (hasError?: boolean) =>
  `${inputBase} ${hasError ? inputErrorState : inputValidState}`

const inputDisabled = "w-full px-3 py-2 text-base sm:text-sm text-slate-500 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"

export default function EmployeeForm({ employee, onCancel, onSuccess }: {
  employee?: Employee; onCancel: () => void; onSuccess: () => void
}) {
  const create = useCreateEmployee()
  const update = useUpdateEmployee(employee?.id ?? '')
  const isEditing = !!employee

  const [eidDisplay, setEidDisplay] = useState(employee?.eidNo ?? '')
  const [fileDisplay, setFileDisplay] = useState(employee?.fileNo ?? '')
  const employeeWithSalary = employee as (Employee & {
    basicSalary?: number | string | null
    housingSalary?: number | string | null
    transpoAllowance?: number | string | null
    totalSalary?: number | string | null
  }) | undefined

  // -- Which employee numbers are already taken? --------------------------
  // Reuses the same list the Dashboard fetches. employeesApi.list's response
  // shape isn't fully known here, so this unwraps defensively rather than
  // assuming a raw array vs. a { data: [...] } / { items: [...] } wrapper.
  const { data: employeesResponse } = useEmployees()
  const employeesList: Employee[] = Array.isArray(employeesResponse)
    ? employeesResponse
    : (employeesResponse as any)?.data ?? (employeesResponse as any)?.items ?? []

  const takenNumbers = new Set(
    employeesList
      .map((e) => e.employeeNumber)
      .filter((num) => num !== employee?.employeeNumber) // don't gray out the record's own number when editing
  )

  const { register, handleSubmit, setValue, setError, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee ? {
      ...employee,
      birthdate: toDisplay(employee.birthdate),
      passportExpiry: toDisplay(employee.passportExpiry),
      laborCardExpiry: toDisplay(employee.laborCardExpiry),
      eidExpiry: toDisplay(employee.eidExpiry),
      visaExpiry: toDisplay(employee.visaExpiry),
      basicSalary: employeeWithSalary?.basicSalary?.toString() ?? '',
      housingSalary: employeeWithSalary?.housingSalary?.toString() ?? '',
      transpoAllowance: employeeWithSalary?.transpoAllowance?.toString() ?? '',
      totalSalary: employeeWithSalary?.totalSalary?.toString() ?? '',
    } : { gender: 'MALE' },
  })

  // -- Auto-sum total salary ------------------------------------------------
  const basicSalary = useWatch({ control, name: 'basicSalary' })
  const housingSalary = useWatch({ control, name: 'housingSalary' })
  const transpoAllowance = useWatch({ control, name: 'transpoAllowance' })

  useEffect(() => {
    const b = parseFloat(basicSalary ?? '0') || 0
    const h = parseFloat(housingSalary ?? '0') || 0
    const t = parseFloat(transpoAllowance ?? '0') || 0
    const total = b + h + t
    setValue('totalSalary', total > 0 ? total.toString() : '')
  }, [basicSalary, housingSalary, transpoAllowance, setValue])

  // -- OCR auto-fill ----------------------------------------------------------
  const handleOcrResult = (result: OcrResult) => {
    if (result.firstName) setValue('firstName', result.firstName)
    if (result.lastName) setValue('lastName', result.lastName)
    if (result.gender) setValue('gender', result.gender)
    if (result.birthdate) setValue('birthdate', result.birthdate)
    if (result.passportNo) setValue('passportNo', result.passportNo.slice(0, 10))
    if (result.passportExpiry) setValue('passportExpiry', result.passportExpiry)
    if (result.eidNo) {
      const masked = maskEid(result.eidNo)
      setEidDisplay(masked)
      setValue('eidNo', masked)
    }
    if (result.eidExpiry) setValue('eidExpiry', result.eidExpiry)
    if (result.uidNo) setValue('uidNo', result.uidNo.replace(/\D/g, '').slice(0, 15))
    if (result.laborCardNo) setValue('laborCardNo', result.laborCardNo.replace(/\D/g, '').slice(0, 9))
    if (result.laborCardExpiry) setValue('laborCardExpiry', result.laborCardExpiry)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await update.mutateAsync(data)
      } else {
        await create.mutateAsync(data)
      }
      onSuccess()
    } catch (err: any) {
      // The validate() middleware in employee.routes.ts returns per-field
      // errors under `details` (from Zod's .flatten().fieldErrors) on a 422.
      // Map each one onto the matching field so it highlights via the same
      // errors-driven inputClass() styling as client-side validation.
      const fieldErrors = err?.response?.data?.details as Record<string, string[]> | undefined
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          setError(field as keyof FormData, { type: 'server', message: messages[0] })
        }
      }
    }
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

        {/* -- OCR Upload -- */}
        <OcrUpload onExtracted={handleOcrResult} />

        {/* -- Personal details -- */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Personal details</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" error={errors.firstName?.message} required>
              <input {...register('firstName')} className={inputClass(!!errors.firstName)} placeholder="Juan" />
            </Field>
            <Field label="Last name" error={errors.lastName?.message} required>
              <input {...register('lastName')} className={inputClass(!!errors.lastName)} placeholder="Dela Cruz" />
            </Field>
            <Field label="Gender" error={errors.gender?.message} required>
              <select {...register('gender')} className={inputClass(!!errors.gender)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Birthdate (DD/MM/YYYY)" error={errors.birthdate?.message} required>
              <input {...register('birthdate')} className={inputClass(!!errors.birthdate)} placeholder="01/01/1990" />
            </Field>
            <Field label="Mobile no." error={errors.mobileNo?.message} required>
              <input {...register('mobileNo')} className={inputClass(!!errors.mobileNo)} placeholder="+971 50 000 0000" />
            </Field>
            <Field label="Email" error={errors.email?.message} required>
              <input {...register('email')} className={inputClass(!!errors.email)} placeholder="name@company.ae" />
            </Field>
            <Field label="Designation" error={errors.designation?.message} required>
              <input {...register('designation')} className={inputClass(!!errors.designation)} placeholder="Software Engineer" />
            </Field>
            {/* Designation according to EID -- sits right below main designation */}
            <Field label="Designation according to EID" error={errors.designationEid?.message}>
              <input {...register('designationEid')} className={inputClass(!!errors.designationEid)} placeholder="As stated on Emirates ID" />
            </Field>
            <Field
              label="Employee no."
              error={errors.employeeNumber?.message}
              required
              hint={isEditing ? undefined : 'Grayed-out numbers are already assigned'}
            >
              <select
                {...register('employeeNumber')}
                className={inputClass(!!errors.employeeNumber)}
                disabled={isEditing}
                style={isEditing ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <option value="">Select Employee Number</option>
                {EMPLOYEE_NUMBERS.map((num) => {
                  const taken = takenNumbers.has(num)
                  return (
                    <option key={num} value={num} disabled={taken} style={taken ? { color: '#94a3b8' } : undefined}>
                      {num}{taken ? ' (Taken)' : ''}
                    </option>
                  )
                })}
              </select>
            </Field>
          </div>
        </div>

        {/* -- Document details -- */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Document details</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Passport #" error={errors.passportNo?.message} hint="Max 10 characters">
              <input
                {...register('passportNo')}
                className={inputClass(!!errors.passportNo)}
                placeholder="P1234567AB"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                  setValue('passportNo', val)
                  e.target.value = val
                }}
              />
            </Field>
            <Field label="Passport expiration (DD/MM/YYYY)" error={errors.passportExpiry?.message}>
              <input {...register('passportExpiry')} className={inputClass(!!errors.passportExpiry)} placeholder="01/01/2030" />
            </Field>

            <Field label="L.C no." error={errors.laborCardNo?.message} hint="Max 9 digits">
              <input
                {...register('laborCardNo')}
                className={inputClass(!!errors.laborCardNo)}
                placeholder="123456789"
                maxLength={9}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                  setValue('laborCardNo', val)
                  e.target.value = val
                }}
              />
            </Field>
            <Field label="L.C expiration (DD/MM/YYYY)" error={errors.laborCardExpiry?.message}>
              <input {...register('laborCardExpiry')} className={inputClass(!!errors.laborCardExpiry)} placeholder="01/01/2026" />
            </Field>

            <Field label="EID no." error={errors.eidNo?.message} hint="Format: XXX-XXXX-XXXXXXX-X">
              <input
                className={inputClass(!!errors.eidNo)}
                placeholder="784-1990-1234567-8"
                maxLength={18}
                value={eidDisplay}
                onChange={(e) => {
                  const masked = maskEid(e.target.value)
                  setEidDisplay(masked)
                  setValue('eidNo', masked, { shouldValidate: true })
                }}
              />
            </Field>
            <Field label="EID expiration (DD/MM/YYYY)" error={errors.eidExpiry?.message}>
              <input {...register('eidExpiry')} className={inputClass(!!errors.eidExpiry)} placeholder="01/01/2027" />
            </Field>

            <Field label="UID no." error={errors.uidNo?.message} hint="Max 15 digits">
              <input
                {...register('uidNo')}
                className={inputClass(!!errors.uidNo)}
                placeholder="784199012345678"
                maxLength={15}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 15)
                  setValue('uidNo', val)
                  e.target.value = val
                }}
              />
            </Field>

            <Field label="File no." error={errors.fileNo?.message} hint="Format: 202/2026/1234567">
              <input
                className={inputClass(!!errors.fileNo)}
                placeholder="202/2026/1234567"
                maxLength={16}
                value={fileDisplay}
                onChange={(e) => {
                  const masked = maskFileNo(e.target.value)
                  setFileDisplay(masked)
                  setValue('fileNo', masked, { shouldValidate: true })
                }}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Visa expiration (DD/MM/YYYY)" error={errors.visaExpiry?.message}>
                <input {...register('visaExpiry')} className={inputClass(!!errors.visaExpiry)} placeholder="01/01/2026" />
              </Field>
            </div>
          </div>
        </div>

        {/* -- Salary details -- */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Salary details</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Basic salary (AED)" error={errors.basicSalary?.message} hint="Max 10 digits">
              <input
                {...register('basicSalary')}
                className={inputClass(!!errors.basicSalary)}
                placeholder="5000"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setValue('basicSalary', val, { shouldValidate: true })
                  e.target.value = val
                }}
              />
            </Field>

            <Field label="Housing salary (AED)" error={errors.housingSalary?.message} hint="Max 10 digits">
              <input
                {...register('housingSalary')}
                className={inputClass(!!errors.housingSalary)}
                placeholder="2000"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setValue('housingSalary', val, { shouldValidate: true })
                  e.target.value = val
                }}
              />
            </Field>

            <Field label="Transportation allowance (AED)" error={errors.transpoAllowance?.message} hint="Max 10 digits">
              <input
                {...register('transpoAllowance')}
                className={inputClass(!!errors.transpoAllowance)}
                placeholder="500"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setValue('transpoAllowance', val, { shouldValidate: true })
                  e.target.value = val
                }}
              />
            </Field>

            {/* Total -- read-only, auto-summed */}
            <Field label="Total salary (AED)">
              <div className="relative">
                <input
                  {...register('totalSalary')}
                  className={inputDisabled}
                  readOnly
                  tabIndex={-1}
                  placeholder="Auto-calculated"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">AUTO</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Sum of basic + housing + transportation</p>
            </Field>
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