"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHandler = extractHandler;
const ocr_service_1 = require("../services/ocr.service");
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
// ─── POST /api/ocr/extract ────────────────────────────────────────────────────
// Body: { base64: string, mimeType: string, documentType: DocumentType }
async function extractHandler(req, res) {
    try {
        const { base64, mimeType, documentType } = req.body;
        // Validate mime type
        if (!ALLOWED_TYPES.includes(mimeType)) {
            res.status(422).json({
                success: false,
                error: 'Unsupported file type. Please upload a JPEG, PNG, or PDF.',
            });
            return;
        }
        // Validate document type
        const validDocTypes = ['PASSPORT', 'EMIRATES_ID', 'LABOR_CARD'];
        if (!validDocTypes.includes(documentType)) {
            res.status(422).json({
                success: false,
                error: 'Invalid document type. Must be PASSPORT, EMIRATES_ID, or LABOR_CARD.',
            });
            return;
        }
        // Validate base64 size
        const sizeBytes = Buffer.byteLength(base64, 'base64');
        if (sizeBytes > MAX_SIZE_BYTES) {
            res.status(422).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.',
            });
            return;
        }
        const result = await (0, ocr_service_1.extractFromImage)(base64, mimeType, documentType);
        res.json({
            success: true,
            data: result,
            message: 'Fields extracted. Please review and confirm before saving.',
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
//# sourceMappingURL=ocr.controller.js.map