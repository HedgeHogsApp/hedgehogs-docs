import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * FB3 — tailwind-merge only knows Tailwind's own size scale, so the project's
 * NAMED sizes (`--text-badge`, `--text-name`, `--text-figure` in
 * `styles/globals.css`) were read as text COLOURS: `cn('text-badge
 * text-fg-secondary')` dropped the size, and the shared chain/protocol pills
 * rendered at whatever size they inherited. Registering them as font sizes keeps
 * a size beside a colour and still resolves a size-vs-size conflict.
 * Note: tailwind-merge treats a font size as conflicting with line-height, so a
 * `leading-*` placed BEFORE `text-badge`/`text-name`/`text-figure` is dropped —
 * put the `leading-*` after the size.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["badge", "name", "figure"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
