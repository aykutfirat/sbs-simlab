export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatMoneyFull(amount: number): string {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
