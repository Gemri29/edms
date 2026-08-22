export type DocumentType = 'PASSPORT' | 'EMIRATES_ID' | 'LABOR_CARD';
export interface OcrResult {
    firstName?: string;
    lastName?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    birthdate?: string;
    passportNo?: string;
    passportExpiry?: string;
    eidNo?: string;
    eidExpiry?: string;
    uidNo?: string;
    laborCardNo?: string;
    laborCardExpiry?: string;
}
export declare function extractFromImage(base64Image: string, mimeType: 'image/jpeg' | 'image/png' | 'application/pdf', documentType: DocumentType): Promise<OcrResult>;
//# sourceMappingURL=ocr.service.d.ts.map