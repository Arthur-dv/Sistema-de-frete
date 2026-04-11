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
    let cleaned = validator.trim(input);
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
      // Formato BR: 1.234,56 → remover pontos de milhar, trocar vírgula por ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      // Somente vírgula: separador decimal BR → 2,5 = 2.5
      cleaned = cleaned.replace(',', '.');
    } else if (hasDot) {
      const parts = cleaned.split('.');
      // Ponto de milhar: 2.000 ou 1.234.567 (parte decimal tem 3 dígitos)
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        cleaned = cleaned.replace(/\./g, '');
      }
      // caso contrário trata como decimal: 2.5 → 2.5
    }

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
