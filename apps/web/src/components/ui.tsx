import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cx(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

