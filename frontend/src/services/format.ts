const ptBR = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ptBRNoDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const ptBROne = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  return `R$ ${ptBR.format(value)}`;
}

export function formatNumber(value: number): string {
  return ptBRNoDecimal.format(value);
}

export function formatDecimal(value: number): string {
  return ptBROne.format(value);
}
