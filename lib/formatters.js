const NBSP = '\u00a0';
const EM_DASH = '\u2014';

export function fmtMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return `0,00${NBSP}$`;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + NBSP + '$';
}

export function fmtMoneyCompact(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return `0${NBSP}$`;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + NBSP + '$';
}

export function fmtMoneyOrDash(n) {
  if (n == null || n === '') return EM_DASH;
  const num = Number(n);
  if (!Number.isFinite(num)) return EM_DASH;
  return fmtMoney(num);
}
