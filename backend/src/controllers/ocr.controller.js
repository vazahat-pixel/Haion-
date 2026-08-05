/**
 * ocr.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Extract text from an uploaded image using Tesseract.js.
 * Used by dealers to auto-fill serial / controller / battery number fields.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Clean extracted OCR text:
 * - Trim whitespace
 * - Keep only alphanumeric + common separator chars (-, /, _)
 * - Collapse multiple spaces to one
 * - Return each detected "token" as individual cleaned strings
 */
function cleanOcrText(raw = '') {
  return raw
    .split('\n')
    .map((line) => line.trim().replace(/[^A-Z0-9\-_/]/gi, '').trim())
    .filter((t) => t.length >= 3)  // ignore very short noise tokens
    .join(' ')
    .trim();
}

/**
 * POST /api/ocr/extract
 * Body: multipart/form-data with field "file" (image)
 * Returns: { text: string, confidence: number, tokens: string[] }
 */
export const extractText = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, { message: 'No image uploaded', statusCode: 400 });
  }

  const filePath = req.file.path;

  try {
    // Dynamic import of tesseract.js (ESM compatible)
    const Tesseract = await import('tesseract.js');
    const { createWorker } = Tesseract.default || Tesseract;

    const worker = await createWorker('eng', 1, {
      logger: () => {}, // suppress progress logs
    });

    // Configure for serial number style text (all caps, clear chars)
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/',
      preserve_interword_spaces: '0',
    });

    const { data } = await worker.recognize(filePath);
    await worker.terminate();

    const rawText = data.text || '';
    const confidence = Math.round(data.confidence || 0);
    const cleanedText = cleanOcrText(rawText);

    // Split into individual tokens (space or hyphen separated)
    const tokens = cleanedText
      .split(/\s+/)
      .filter((t) => t.length >= 3);

    // Quality check: warn if confidence is low
    const qualityOk = confidence >= 60;

    return sendSuccess(res, {
      data: {
        text: cleanedText,
        rawText: rawText.trim(),
        confidence,
        qualityOk,
        tokens,
        tip: !qualityOk
          ? 'Image quality is low. Please capture a clear, well-lit, close-up photo of the number plate/sticker.'
          : null,
      },
      message: 'OCR extraction complete',
    });
  } catch (err) {
    console.error('[OCR] Tesseract error:', err);
    return sendError(res, { message: 'OCR processing failed. Please try again with a clearer image.', statusCode: 500 });
  } finally {
    // Clean up uploaded temp file
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
});
