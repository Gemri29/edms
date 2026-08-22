import { Resend } from 'resend'
import { prisma } from '../lib/prisma'
import { getExpiringEmployees } from './employee.service'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@yourdomain.com'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

type DocEntry = {
  employeeName: string
  employeeNumber: string
  document: string
  expiryDate: Date
  daysLeft: number
  isExpired: boolean
}

// ─── Build document alert list from employee data ─────────────────────────────

function buildDocEntries(employees: Awaited<ReturnType<typeof getExpiringEmployees>>): DocEntry[] {
  const entries: DocEntry[] = []
  const now = new Date()

  const docFields: { key: keyof typeof employees[0]; label: string }[] = [
    { key: 'passportExpiry', label: 'Passport' },
    { key: 'laborCardExpiry', label: 'Labor Card' },
    { key: 'eidExpiry', label: 'Emirates ID' },
    { key: 'visaExpiry', label: 'Visa' },
  ]

  for (const emp of employees) {
    for (const { key, label } of docFields) {
      const date = emp[key] as Date | null
      if (!date) continue
      const daysLeft = daysUntil(date)
      const isExpired = date < now
      // Include expired + expiring within 6 months
      if (daysLeft <= 180 || isExpired) {
        entries.push({
          employeeName: `${emp.lastName}, ${emp.firstName}`,
          employeeNumber: emp.employeeNumber,
          document: label,
          expiryDate: date,
          daysLeft,
          isExpired,
        })
      }
    }
  }

  // Sort: expired first, then by days left ascending
  return entries.sort((a, b) => {
    if (a.isExpired && !b.isExpired) return -1
    if (!a.isExpired && b.isExpired) return 1
    return a.daysLeft - b.daysLeft
  })
}

// ─── Build HTML email ─────────────────────────────────────────────────────────

function buildEmailHtml(entries: DocEntry[], recipientName: string): string {
  const expired = entries.filter((e) => e.isExpired)
  const expiring = entries.filter((e) => !e.isExpired)

  const rowHtml = (e: DocEntry) => `
    <tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:10px 12px;font-size:13px;color:#1a1a1a;font-weight:500">${e.employeeName}</td>
      <td style="padding:10px 12px;font-size:13px;color:#666">${e.employeeNumber}</td>
      <td style="padding:10px 12px;font-size:13px;color:#666">${e.document}</td>
      <td style="padding:10px 12px;font-size:13px;color:#666">${formatDate(e.expiryDate)}</td>
      <td style="padding:10px 12px;font-size:13px;font-weight:500;color:${e.isExpired ? '#a32d2d' : '#854f0b'}">
        ${e.isExpired ? `Expired ${Math.abs(e.daysLeft)} days ago` : `${e.daysLeft} days left`}
      </td>
    </tr>
  `

  const tableHtml = (rows: DocEntry[], label: string, color: string) => `
    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${label}</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f8f8f8">
            <th style="padding:9px 12px;font-size:11px;font-weight:600;color:#888;text-align:left;text-transform:uppercase">Employee</th>
            <th style="padding:9px 12px;font-size:11px;font-weight:600;color:#888;text-align:left;text-transform:uppercase">No.</th>
            <th style="padding:9px 12px;font-size:11px;font-weight:600;color:#888;text-align:left;text-transform:uppercase">Document</th>
            <th style="padding:9px 12px;font-size:11px;font-weight:600;color:#888;text-align:left;text-transform:uppercase">Expiry Date</th>
            <th style="padding:9px 12px;font-size:11px;font-weight:600;color:#888;text-align:left;text-transform:uppercase">Status</th>
          </tr>
        </thead>
        <tbody>${rows.map(rowHtml).join('')}</tbody>
      </table>
    </div>
  `

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8">
        <div style="background:#1e3a5f;padding:20px 28px;display:flex;align-items:center;gap:12px">
          <div style="font-size:18px;font-weight:600;color:#fff">EDMS</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6);margin-left:auto">Document Expiry Alert</div>
        </div>
        <div style="padding:28px">
          <p style="font-size:14px;color:#444;margin-bottom:6px">Hi ${recipientName},</p>
          <p style="font-size:14px;color:#444;margin-bottom:24px;line-height:1.6">
            The following employee documents require your attention.
            Please arrange renewals as soon as possible.
          </p>
          ${expired.length > 0 ? tableHtml(expired, '🔴 Already Expired', '#a32d2d') : ''}
          ${expiring.length > 0 ? tableHtml(expiring, '🟡 Expiring Within 6 Months', '#854f0b') : ''}
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#999;text-align:center">
            EDMS · Internal Use Only · Do not forward this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Main digest function (called by cron) ────────────────────────────────────

export async function sendExpiryDigest(): Promise<void> {
  const employees = await getExpiringEmployees()
  if (employees.length === 0) {
    console.log('[notifications] No expiring documents found. No email sent.')
    return
  }

  const entries = buildDocEntries(employees)
  if (entries.length === 0) return

  // Get all active admins to notify
  const admins = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, fullName: true },
  })

  const expiredCount = entries.filter((e) => e.isExpired).length
  const expiringCount = entries.filter((e) => !e.isExpired).length

  const subject =
    expiredCount > 0
      ? `[EDMS] ⚠️ ${expiredCount} expired + ${expiringCount} expiring soon`
      : `[EDMS] ${expiringCount} document${expiringCount > 1 ? 's' : ''} expiring soon`

  for (const admin of admins) {
    try {
      await resend.emails.send({
        from: FROM,
        to: admin.email,
        subject,
        html: buildEmailHtml(entries, admin.fullName),
      })
      console.log(`[notifications] Digest sent to ${admin.email}`)
    } catch (err) {
      console.error(`[notifications] Failed to send to ${admin.email}:`, err)
    }
  }
}
