import validator from 'validator';

export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return validator.escape(validator.trim(input));
}

export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = validator.trim(input).toLowerCase();
  if (!validator.isEmail(trimmed)) return '';
  return validator.normalizeEmail(trimmed) || '';
}

export function sanitizeNumber(input: unknown): number {
  if (typeof input === 'number' && isFinite(input)) return input;
  if (typeof input === 'string') {
    const cleaned = input.replace(',', '.');
    const num = parseFloat(cleaned);
    if (isFinite(num)) return num;
  }
  return 0;
}

export function sanitizeDateString(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = validator.trim(input);
  if (trimmed.length > 20) return '';
  return validator.escape(trimmed);
}
