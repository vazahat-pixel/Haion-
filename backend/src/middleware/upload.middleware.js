import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Allowed MIME → allowed extensions mapping (double validation) ─────────────
const MIME_TO_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

// ── Sanitize filename: strip path traversal, limit length ─────────────────────
function sanitizeFilename(originalname) {
  // Remove directory components, null bytes, and non-safe characters
  const base = path.basename(originalname)
    .replace(/\0/g, '')         // null bytes
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // only allow safe chars
    .slice(0, 100);             // max 100 chars
  return base || 'upload';
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(sanitizeFilename(file.originalname)).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

// ── File filter: validate MIME type AND file extension together ───────────────
function fileFilter(allowedMimes) {
  return (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
    // Double-check: extension must match the declared MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = allowedMimes.flatMap((m) => MIME_TO_EXT[m] || []);
    if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
      return cb(new Error(`File extension ${ext} does not match declared type`), false);
    }
    cb(null, true);
  };
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },    // 2 MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },    // 5 MB
  fileFilter: fileFilter(['application/pdf', 'image/jpeg', 'image/png']),
});

// ── SECURITY: uploadAny is intentionally removed ──────────────────────────────
// Using uploadAny (no type restriction) allows uploading .exe, .sh, .php, etc.
// Always use uploadImage or uploadDocument. If you need a new type, add it above.
