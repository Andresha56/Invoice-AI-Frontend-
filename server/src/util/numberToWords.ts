import { DEFAULT_CURRENCY } from "../constant/index.js";
import { convertThousands } from "./convertThousands.js";

export const numberToWords = (num: number, currency: string): string => {
  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Only";

  let result = "";
  if (rounded >= 10_000_000) {
    result += `${convertThousands(Math.floor(rounded / 10_000_000))} Crore `;
  }
  if (rounded % 10_000_000 >= 100_000) {
    result += `${convertThousands(Math.floor((rounded % 10_000_000) / 100_000))} Lakh `;
  }
  if (rounded % 100_000 >= 1_000) {
    result += `${convertThousands(Math.floor((rounded % 100_000) / 1_000))} Thousand `;
  }
  if (rounded % 1_000 > 0) {
    result += convertThousands(rounded % 1_000);
  }

  const currencyWord = currency === DEFAULT_CURRENCY ? "Rupees" : "Dollars";
  return `${result.trim()} ${currencyWord} Only`;
};


