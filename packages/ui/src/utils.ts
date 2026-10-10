import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge needs to know the custom scale names from apps/web/tailwind.config.ts,
 * otherwise `text-ui` would be read as a color and dropped next to `text-ink`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["meta", "small", "ui", "prose", "lead", "h3", "h2", "h1", "hero"] }],
      shadow: [{ shadow: ["float", "header"] }],
      rounded: [{ rounded: ["control", "field", "panel"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
