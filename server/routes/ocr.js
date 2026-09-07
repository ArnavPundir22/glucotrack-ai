import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const OCR_PROMPT = `
You are a specialized medical computer vision assistant trained on optical character recognition (OCR) for handheld blood glucose meters (e.g. Accu-Chek, OneTouch, Contour Next, Freestyle Lite, True Metrix, Dr. Morepen, Roche, Bayer).

CRITICAL DISPLAY ANALYSIS RULES:
1. FOCUS ONLY ON GLUCOSE DISPLAY:
   - Identify the main digital display screen of the glucometer device.
   - Ignore peripheral digits such as clock time (e.g., "12:30"), date ("09/07"), memory slot indexes ("MEM 01", "LOG 03"), or test strip code numbers ("C25").
   - Extract ONLY the primary, largest numeric reading representing blood glucose level.

2. 7-SEGMENT DIGITAL DISPLAY GEOMETRY & PARSING RULES:
   - LCD displays use 7-segment digital digits. Examine segment lines carefully.
   - Distinguish '8' (all 7 segments lit) vs '0' (middle segment unlit).
   - Distinguish '6' (top, middle, bottom, left-top, left-bottom, right-bottom) vs '5' vs '9'.
   - Distinguish '1' (right-top, right-bottom) vs '7' (top, right-top, right-bottom).
   - Carefully look for decimal points (e.g. "6.8" vs "68", "12.4" vs "124").

3. UNIT IDENTIFICATION RULES:
   - Check if unit text ("mg/dL" or "mmol/L") is visible on screen.
   - If unit text is unreadable/missing: values > 30 are mg/dL; values < 30 are mmol/L.

4. CONFIDENCE & CONTEXT:
   - Assign visual confidence score (0.0 to 1.0) based on image clarity, lighting, and LCD contrast.
   - Detect meal context icon if present (fasting/apple core, pre-meal, post-meal).
   - Detect glucometer brand if printed on bezel or display screen.

Return ONLY a JSON object with this exact structure:
{
  "value": number,
  "unit": "mg/dL" | "mmol/L",
  "confidence": number,
  "detected_timestamp": string | null,
  "suggested_meal_context": "fasting" | "pre_meal" | "post_meal" | "bedtime" | "random",
  "device_brand": string | null
}
Do NOT include markdown backticks or extra text outside JSON.
`;

router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    let mimeType = 'image/jpeg';
    let base64Clean = '';

    if (req.file) {
      mimeType = req.file.mimetype || 'image/jpeg';
      base64Clean = req.file.buffer.toString('base64');
    } else if (req.body && req.body.image_base64) {
      const str = req.body.image_base64;
      const mimeMatch = str.match(/^data:(image\/[a-zA-Z0-9\-\+\.]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      base64Clean = str.replace(/^data:image\/[a-zA-Z0-9\-\+\.]+;base64,/, '').trim();
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No image file or base64 data provided.',
      });
    }

    const apiKeys = [];
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_PRIMARY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      apiKeys.push(process.env.GEMINI_API_KEY);
    }
    if (process.env.GEMINI_API_KEY_FALLBACK && process.env.GEMINI_API_KEY_FALLBACK !== 'YOUR_FALLBACK_GEMINI_API_KEY') {
      if (!apiKeys.includes(process.env.GEMINI_API_KEY_FALLBACK)) {
        apiKeys.push(process.env.GEMINI_API_KEY_FALLBACK);
      }
    }

    let extractedData = null;
    let isAiProcessed = false;
    let lastError = null;

    const modelNames = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.6-flash-lite',
      'gemini-1.5-flash-8b',
    ];

    keyLoop: for (let kIdx = 0; kIdx < apiKeys.length; kIdx++) {
      const apiKey = apiKeys[kIdx];
      console.log(`[OCR Service] Using API Key #${kIdx + 1}...`);

      for (const modelName of modelNames) {
        try {
          console.log(`[OCR Service] Attempting Gemini Vision extraction with model: ${modelName}...`);
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });

          const imagePart = {
            inlineData: {
              data: base64Clean,
              mimeType: mimeType,
            },
          };

          const result = await model.generateContent([OCR_PROMPT, imagePart]);
          const responseText = result.response.text().trim();
          console.log(`[OCR Service] Raw response from ${modelName}:`, responseText);

          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && typeof parsed.value === 'number' && !isNaN(parsed.value) && parsed.value > 0) {
              extractedData = parsed;
              isAiProcessed = true;
              console.log(`[OCR Service] Successfully extracted reading with ${modelName}:`, extractedData);
              break keyLoop;
            }
          }
        } catch (geminiErr) {
          lastError = geminiErr.message;
          console.warn(`[OCR Service] Gemini model ${modelName} error:`, geminiErr.message);
        }
      }
    }

    if (!extractedData) {
      console.warn('[OCR Service] Vision extraction could not resolve reading:', lastError);
      const isQuotaError = lastError && lastError.includes('429');
      return res.status(422).json({
        status: 'error',
        message: isQuotaError
          ? 'Google Gemini API daily free tier quota exceeded. Please wait a short moment or enter your reading manually.'
          : 'Could not clearly read the blood glucose value from this image. Please ensure proper screen lighting and focus, or enter the reading manually.',
        error: lastError,
      });
    }

    let valMgDl = extractedData.value;
    if (extractedData.unit === 'mmol/L') {
      valMgDl = parseFloat((extractedData.value * 18.018).toFixed(1));
    }

    const auditId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await db.run(
      `INSERT INTO ocr_audit_logs (id, raw_ai_response, confidence_score, is_user_edited)
       VALUES (?, ?, ?, 0)`,
      [auditId, JSON.stringify(extractedData), extractedData.confidence || 0.95]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        ocr_log_id: auditId,
        value: extractedData.value,
        unit: extractedData.unit || 'mg/dL',
        value_mgdl: valMgDl,
        confidence: extractedData.confidence || 0.95,
        detected_timestamp: extractedData.detected_timestamp || new Date().toISOString(),
        suggested_meal_context: extractedData.suggested_meal_context || 'post_meal',
        device_brand: extractedData.device_brand || 'Glucometer',
        is_ai_processed: isAiProcessed,
        image_preview: `data:${mimeType};base64,${base64Clean}`,
      },
    });
  } catch (err) {
    console.error('[OCR Service] Extraction failure:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process glucometer display image.',
      error: err.message,
    });
  }
});

export default router;
