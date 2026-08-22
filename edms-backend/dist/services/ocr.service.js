"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromImage = extractFromImage;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// ─── Prompt per document type ─────────────────────────────────────────────────
const PROMPTS = {
    PASSPORT: `
    You are extracting data from a passport image.
    Return ONLY a valid JSON object with these fields (omit fields you cannot read):
    {
      "firstName": "string",
      "lastName": "string",
      "gender": "MALE" | "FEMALE" | "OTHER",
      "birthdate": "DD/MM/YYYY",
      "passportNo": "string",
      "passportExpiry": "DD/MM/YYYY"
    }
    Rules:
    - All dates must be in DD/MM/YYYY format
    - Gender: M or Male = "MALE", F or Female = "FEMALE"
    - Return only the JSON, no explanation, no markdown
  `,
    EMIRATES_ID: `
    You are extracting data from a UAE Emirates ID card image.
    Return ONLY a valid JSON object with these fields (omit fields you cannot read):
    {
      "firstName": "string",
      "lastName": "string",
      "gender": "MALE" | "FEMALE" | "OTHER",
      "birthdate": "DD/MM/YYYY",
      "eidNo": "string",
      "eidExpiry": "DD/MM/YYYY",
      "uidNo": "string"
    }
    Rules:
    - eidNo format is typically 784-YYYY-XXXXXXX-X
    - All dates must be in DD/MM/YYYY format
    - Return only the JSON, no explanation, no markdown
  `,
    LABOR_CARD: `
    You are extracting data from a UAE Labor Card image.
    Return ONLY a valid JSON object with these fields (omit fields you cannot read):
    {
      "firstName": "string",
      "lastName": "string",
      "laborCardNo": "string",
      "laborCardExpiry": "DD/MM/YYYY"
    }
    Rules:
    - All dates must be in DD/MM/YYYY format
    - Return only the JSON, no explanation, no markdown
  `,
};
// ─── Extract fields from image ────────────────────────────────────────────────
async function extractFromImage(base64Image, mimeType, documentType) {
    const prompt = PROMPTS[documentType];
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${base64Image}`,
                            detail: 'high',
                        },
                    },
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ],
    });
    const raw = response.choices[0]?.message?.content ?? '';
    // Strip markdown code fences if GPT wraps in ```json ... ```
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch {
        throw new Error('OCR extraction failed — could not parse response. Please fill in the fields manually.');
    }
    return parsed;
}
//# sourceMappingURL=ocr.service.js.map