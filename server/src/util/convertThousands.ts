import { ONES, TENS } from "../constant/index.js";

export const convertThousands = (n: number): string => {
  if (n === 0) return "";
  if (n < 20) return ONES[n] ?? "";
  if (n < 100) {
    return `${TENS[Math.floor(n / 10)] ?? ""} ${ONES[n % 10] ?? ""}`.trim();
  }
  return `${ONES[Math.floor(n / 100)] ?? ""} Hundred ${convertThousands(n % 100)}`.trim();
};