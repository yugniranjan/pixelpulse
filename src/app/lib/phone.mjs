// Presentation only: callers keep the original value for storage and dial links.
export function formatPhoneNumber(value = '') {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const extension = text.match(/\s*(?:ext\.?|extension|x|#)\s*(\d+)$/i);
  const number = extension ? text.slice(0, extension.index).trim() : text;
  if (!/^[+\d\s().-]+$/.test(number)) return text;
  let digits = number.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return text;
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}${extension ? ` ext. ${extension[1]}` : ''}`;
}

export function phoneSearchDigits(value = '') {
  const text = String(value ?? '').trim();
  if (!/^[+\d\s().-]+$/.test(text)) return '';
  let digits = text.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.length >= 3 ? digits : '';
}

export function normalizePhoneDigits(value = '') {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function phoneLookupVariants(value = '') {
  const digits = normalizePhoneDigits(value);
  return digits ? digits.length === 10 ? [digits, `1${digits}`] : [digits] : [];
}

export function phoneTextVariants(value = '') {
  const text = String(value ?? '').trim();
  const digits = normalizePhoneDigits(value);
  if (digits.length !== 10) return [...new Set([text, digits].filter(Boolean))];
  const area = digits.slice(0, 3), prefix = digits.slice(3, 6), line = digits.slice(6);
  return [...new Set([text, ...phoneLookupVariants(text), `+1${digits}`, `(${area})-${prefix}-${line}`, `(${area}) ${prefix}-${line}`, `${area}-${prefix}-${line}`, `${area} ${prefix} ${line}`, `+1 (${area}) ${prefix}-${line}`, `1 ${area}-${prefix}-${line}`])];
}

export function matchesPhoneSearch(value, query) {
  const digits = phoneSearchDigits(query);
  return Boolean(digits && String(value ?? '').replace(/\D/g, '').includes(digits));
}
