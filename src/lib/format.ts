const NBSP = ' ';
const THIN = ' ';

const nf2 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Число с русской десятичной запятой. */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '∞';
  if (digits === 0) return nf0.format(n);
  if (digits === 2) return nf2.format(n);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

/** Фиксированное число знаков после запятой. */
export function fmtFixed(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '∞';
  return n.toFixed(digits).replace('.', ',').replace('-', '−');
}

/** Вероятность как проценты: 0,314 → «31,4 %». */
export function fmtPct(p: number, digits = 1): string {
  return `${fmtFixed(p * 100, digits)}${THIN}%`;
}

/** Большие числа: 124 000 000 → «124 млн». */
export function fmtBig(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${fmtFixed(n / 1e12, abs / 1e12 >= 10 ? 0 : 1)}${NBSP}трлн`;
  if (abs >= 1e9) return `${fmtFixed(n / 1e9, abs / 1e9 >= 10 ? 0 : 1)}${NBSP}млрд`;
  if (abs >= 1e6) return `${fmtFixed(n / 1e6, abs / 1e6 >= 10 ? 0 : 1)}${NBSP}млн`;
  if (abs >= 1e3) return `${fmtFixed(n / 1e3, abs / 1e3 >= 10 ? 0 : 1)}${NBSP}тыс.`;
  return nf0.format(n);
}

/** Байты → ГБ/МБ. */
export function fmtBytes(bytes: number): string {
  if (bytes >= 1e12) return `${fmtFixed(bytes / 1e12, 1)}${NBSP}ТБ`;
  if (bytes >= 1e9) return `${fmtFixed(bytes / 1e9, 1)}${NBSP}ГБ`;
  if (bytes >= 1e6) return `${fmtFixed(bytes / 1e6, 0)}${NBSP}МБ`;
  return `${nf0.format(bytes)}${NBSP}Б`;
}

/** Склонение: plural(3, ['токен', 'токена', 'токенов']) → «3 токена». */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  const form = abs > 10 && abs < 20 ? forms[2] : last === 1 ? forms[0] : last >= 2 && last <= 4 ? forms[1] : forms[2];
  return `${nf0.format(n)}${NBSP}${form}`;
}
