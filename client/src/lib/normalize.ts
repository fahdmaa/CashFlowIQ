// Client-side normalization utilities

// Normalize an amount input to a clean decimal string.
// - Trims whitespace
// - Removes currency text/symbols/letters
// - Converts "," to "." when used as decimal separator
// - Keeps at most one decimal separator and digits
// Examples:
//   "28 DH" -> "28"
//   "28,00 dh" -> "28.00"
//   "  1.234,50 MAD " -> "1234.50"
export function normalizeAmount(input: string | number): string {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return '';
    return String(input);
  }

  let s = (input ?? '').toString().trim().toLowerCase();

  // Handle comma vs dot: if string contains commas and no dot, treat commas as decimal separators
  if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
  else s = s.replace(/,/g, ''); // Otherwise commas are grouping separators; drop them

  // Remove everything except digits, dot, and optional leading minus
  s = s.replace(/[^0-9.\-]/g, '');

  // Ensure only a single leading minus
  s = s.replace(/(?!^)-/g, '');

  // If multiple dots, keep the first
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }

  // Validate parses to a finite number
  const val = parseFloat(s);
  if (!Number.isFinite(val)) return '';

  return s;
}

// Normalize DD/MM/YYYY or YYYY-MM-DD to ISO 8601 (UTC midnight)
export function normalizeDateToISO(input: string | Date): string {
  if (input instanceof Date) {
    return input.toISOString();
  }

  // ISO-like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toISOString();
  }

  // DD/MM/YYYY
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const y = parseInt(yyyy, 10);
    const mon = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    if (mon < 1 || mon > 12 || day < 1 || day > 31) throw new Error('Invalid date format. Use DD/MM/YYYY.');
    const dt = new Date(Date.UTC(y, mon - 1, day));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mon - 1 || dt.getUTCDate() !== day) throw new Error('Invalid calendar date.');
    return dt.toISOString();
  }

  // Fallback to Date parser
  return new Date(input).toISOString();
}

