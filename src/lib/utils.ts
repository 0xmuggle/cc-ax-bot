import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FilterState } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add a throttle utility function
export const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  return function (this: any, ...args: any[]) {
    lastArgs = args;
    lastThis = this;

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(lastThis, lastArgs);
        timeoutId = null;
        lastArgs = null;
        lastThis = null;
      }, delay);
    }
  };
};

export function calculateSellPrice(buyMc: number) {
  // 计算回撤比例 RR(P)
  let retracementRatio;
  const peakMarketCap = buyMc / 1000;
  
  if (peakMarketCap <= 60) {
      // P <= 60K: RR(P) = 0.3 + 0.00165 * (P - 40)
      retracementRatio = 0.32 + 0.00165 * (peakMarketCap - 40);
  } else if (peakMarketCap <= 140) {
      // 60K < P <= 140K: RR(P) = 0.333 - 0.00059125 * (P - 60)
      retracementRatio = 0.353 - 0.00059125 * (peakMarketCap - 60);
  } else {
      // P > 140K: RR(P) = 0.2857 - 0.0001868478 * (P - 140)
      retracementRatio = 0.2957 - 0.0001868478 * (peakMarketCap - 140);
  }
  
  // 计算卖点价格（单位：K）
  const sellPriceInK = peakMarketCap * (1 - retracementRatio);
  
  // 转换为美元并四舍五入到整数
  return sellPriceInK * 1000;
}

// Helper to parse range inputs like "10" (min only) or "10,20" (min,max)
export const parseRangeInput = (
  value: string,
  multiplier: number = 1
): [number | undefined, number | undefined] => {
  if (!value) return [undefined, undefined];
  const parts = value.split(",").map((p) => p.trim());
  if (parts.length === 1 && parts[0]) {
    const num = parseFloat(parts[0]);
    return [undefined, num * multiplier]; // Only min value provided
  }
  if (parts.length === 2) {
    const min = parts[0] ? parseFloat(parts[0]) * multiplier : undefined;
    const max = parts[1] ? parseFloat(parts[1]) * multiplier : undefined;
    return [min, max];
  }
  return [undefined, undefined];
};

// Helper to format range values back to string for display
export const formatRangeOutput = (
  min: number | undefined,
  max: number | undefined,
  divisor: number = 1
): string => {
  if (min === undefined && max === undefined) return "";
  if (min !== undefined && max === undefined) return `${min / divisor},`;
  if (min === undefined && max !== undefined) return `${max / divisor}`;
  return `${min !== undefined ? min / divisor : ""},${
    max !== undefined ? max / divisor : ""
  }`;
};

export const formatFilter = (formState: any) => {
  return {
    ...formState,
    // Parse range inputs from string to numbers
    marketCapMin: parseRangeInput(formState.marketCap, 1000)[0],
    marketCapMax: parseRangeInput(formState.marketCap, 1000)[1],
    volumeKMin: parseRangeInput(formState.volumeK, 1)[0],
    volumeKMax: parseRangeInput(formState.volumeK, 1)[1],
    totalTxMin: parseRangeInput(formState.totalTx, 1)[0],
    totalTxMax: parseRangeInput(formState.totalTx, 1)[1],
    bundledMin: parseRangeInput(formState.bundled, 1)[0],
    bundledMax: parseRangeInput(formState.bundled, 1)[1],
    marketCap1MMin: parseRangeInput(formState.marketCap1M, 1000)[0],
    marketCap1MMax: parseRangeInput(formState.marketCap1M, 1000)[1],
    marketCap2MMin: parseRangeInput(formState.marketCap2M, 1000)[0],
    marketCap2MMax: parseRangeInput(formState.marketCap2M, 1000)[1],
    marketCap3MMin: parseRangeInput(formState.marketCap3M, 1000)[0],
    marketCap3MMax: parseRangeInput(formState.marketCap3M, 1000)[1],
    marketCap5MMin: parseRangeInput(formState.marketCap5M, 1000)[0],
    marketCap5MMax: parseRangeInput(formState.marketCap5M, 1000)[1],
    marketCap10MMin: parseRangeInput(formState.marketCap10M, 1000)[0],
    marketCap10MMax: parseRangeInput(formState.marketCap10M, 1000)[1],
    marketCap15MMin: parseRangeInput(formState.marketCap15M, 1000)[0],
    marketCap15MMax: parseRangeInput(formState.marketCap15M, 1000)[1],
    marketCap30MMin: parseRangeInput(formState.marketCap30M, 1000)[0],
    marketCap30MMax: parseRangeInput(formState.marketCap30M, 1000)[1],
  };
};
