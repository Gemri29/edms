import api from '../lib/axios'
import type { OcrResult, DocumentType, ApiResponse } from '../types'

export const ocrApi = {
  extract: (base64: string, mimeType: string, documentType: DocumentType) =>
    api.post<ApiResponse<OcrResult>>('/api/ocr/extract', { base64, mimeType, documentType }),
}
