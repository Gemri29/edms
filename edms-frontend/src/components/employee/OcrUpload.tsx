import { useRef, useState } from 'react'
import { Scan, Upload } from 'lucide-react'
import { ocrApi } from '../../api/ocr'
import type { DocumentType, OcrResult } from '../../types'


export default function OcrUpload({ onExtracted }: { onExtracted: (data: OcrResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType>('PASSPORT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
  setError(null)
  setLoading(true)
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = () => reject(new Error('Could not read the selected file.'))
      reader.readAsDataURL(file)
    })

    const res = await ocrApi.extract(base64, file.type, docType)
    onExtracted(res.data.data)
  } catch (err: any) {
    setError(err?.response?.data?.error ?? 'OCR failed. Please fill in fields manually.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <Scan size={18} className="text-slate-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-800">Upload ID for auto-fill</p>
        <p className="text-xs text-slate-400 mt-0.5">Upload a passport, Emirates ID, or labor card — fields will be pre-filled after scanning.</p>
      </div>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value as DocumentType)}
        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        <option value="PASSPORT">Passport</option>
        <option value="EMIRATES_ID">Emirates ID</option>
        <option value="LABOR_CARD">Labor Card</option>
      </select>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
        <Upload size={13} />{loading ? 'Scanning…' : 'Choose file'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
