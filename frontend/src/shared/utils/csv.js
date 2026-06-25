// ============================================================================
//  shared/utils/csv.js — tiny dependency-free CSV helpers
// ----------------------------------------------------------------------------
//  Used by the analytics export buttons. Kept minimal on purpose: we want
//  predictable Excel/Sheets/Numbers behaviour without pulling in a 50KB
//  CSV library for what is fundamentally string concatenation.
//
//  Quoting rules follow RFC 4180:
//    - Fields containing commas, quotes, CR, or LF are wrapped in double
//      quotes.
//    - Embedded double quotes are doubled ("" inside the field).
//    - Newlines use CRLF, which Excel prefers.
// ============================================================================

const NEEDS_QUOTING = /[",\r\n]/;

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (!NEEDS_QUOTING.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Serialize an array of plain objects into a CSV string.
 *
 * @param {Array<Object>} rows
 * @param {Array<string|{key:string,label?:string,format?:Function}>} columns
 *   Either bare keys or `{ key, label, format }` descriptors. Labels default
 *   to `key`; format defaults to identity.
 * @returns {string}
 */
export function toCsv(rows, columns) {
  if (!Array.isArray(columns) || columns.length === 0) return '';
  const defs = columns.map((c) =>
    typeof c === 'string' ? { key: c, label: c, format: (v) => v } : {
      key:    c.key,
      label:  c.label ?? c.key,
      format: c.format ?? ((v) => v),
    }
  );
  const header = defs.map((d) => escapeCell(d.label)).join(',');
  const body   = (rows || [])
    .map((row) => defs.map((d) => escapeCell(d.format(row?.[d.key], row))).join(','))
    .join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/**
 * Trigger a browser download for the given CSV text. Cleans up the object
 * URL on the next tick so we don't leak blobs.
 */
export function downloadCsv(filename, csvText) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const safeName = /\.csv$/i.test(filename) ? filename : `${filename}.csv`;
  // BOM ensures Excel treats it as UTF-8.
  const blob = new Blob([`\uFEFF${csvText}`], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default { toCsv, downloadCsv };
