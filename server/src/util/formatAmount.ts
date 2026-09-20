export const formatAmount = (value: number, symbol: string): string =>
  `${symbol}${value.toLocaleString("en-IN")}`;
