// ============================================================================
//  middleware/uploadOrgLogo — disk-backed image upload for org logos
// ----------------------------------------------------------------------------
//  Saves the uploaded file under backend/uploads/org-logos/ with a random
//  name. Limits applied here (not in the controller) so the parser itself
//  rejects oversize requests before reading the full body:
//
//    - 2 MB hard cap (per-org logo, this is generous)
//    - MIME allowlist: image/png, image/jpeg, image/webp, image/svg+xml
//    - Random 16-byte filename + sanitized extension so a malicious
//      original name cannot escape the destination directory.
//
//  The destination directory is created lazily on first use so a fresh
//  clone never needs a manual mkdir.
// ============================================================================

import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/middleware -> backend/uploads/org-logos
export const ORG_LOGO_DIR = path.resolve(__dirname, '../../uploads/org-logos');

function ensureDir() {
  try {
    fs.mkdirSync(ORG_LOGO_DIR, { recursive: true });
  } catch (err) {
    // EEXIST is expected on every call after the first.
    if (err.code !== 'EEXIST') throw err;
  }
}

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

const EXT_FOR_MIME = {
  'image/png':     '.png',
  'image/jpeg':    '.jpg',
  'image/webp':    '.webp',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDir();
      cb(null, ORG_LOGO_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    // Random name + canonical extension from MIME. Ignore the original
    // filename entirely — it is attacker-controlled.
    const ext = EXT_FOR_MIME[file.mimetype] || '.bin';
    const name = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  // multer wraps non-fatal cb errors as MulterError, but a plain Error here
  // surfaces a meaningful message at the controller layer.
  const err = new Error('Logo must be PNG, JPEG, WEBP, or SVG.');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
}

export const uploadOrgLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },
}).single('logo');

export default uploadOrgLogo;
