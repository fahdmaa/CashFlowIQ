// Server-side normalization utilities (no external deps)

export function normalizeAmountServer(input: unknown): string {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return '';
    return String(input);
  }
  const raw = (input ?? '').toString();
  let s = raw.trim().toLowerCase();

  if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
  else s = s.replace(/,/g, '');

  s = s.replace(/[^0-9.\-]/g, '');
  s = s.replace(/(?!^)-/g, '');

  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }

  const val = parseFloat(s);
  if (!Number.isFinite(val)) return '';
  return s;
}

export function normalizeDateToISOServer(input: unknown): string {
  if (input instanceof Date) return input.toISOString();
  const s = (input ?? '').toString();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toISOString();
  }

  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const y = parseInt(yyyy, 10);
    const mon = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    if (mon < 1 || mon > 12 || day < 1 || day > 31) throw badReq('Invalid date format. Use DD/MM/YYYY.');
    const dt = new Date(Date.UTC(y, mon - 1, day));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mon - 1 || dt.getUTCDate() !== day) throw badReq('Invalid calendar date.');
    return dt.toISOString();
  }

  const iso = new Date(s).toISOString();
  if (!iso || Number.isNaN(new Date(iso).getTime())) throw badReq('Invalid date.');
  return iso;
}

export function badReq(message: string) {
  const err: any = new Error(message);
  err.status = 400;
  return err;
}

