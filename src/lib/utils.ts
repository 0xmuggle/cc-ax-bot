import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add a throttle utility function
export const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  return function(this: any, ...args: any[]) {
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
