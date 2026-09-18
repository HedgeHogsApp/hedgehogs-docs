/**
 * lib/motion/tokens.ts — the app's motion scale, for JS-driven animation.
 *
 * These MIRROR `styles/globals.css` (`--transition-duration-*`,
 * `--ease-out-*`): CSS transitions read the custom properties, `motion/react`
 * cannot, and a component that hard-codes `duration: 0.15` has quietly opted
 * out of the scale. Change one, change the other.
 *
 * Not to be confused with the neighbouring `lib/motion.ts`, which holds
 * Interior's spring configs for `components/interior/*`. This file is the
 * duration/easing scale itself.
 */

/** Milliseconds, mirroring `--transition-duration-*` in `styles/globals.css`. */
export const DURATION_MS = {
  /** 100ms — a state swap the eye should not have to wait for. */
  fast: 100,
  /** 200ms — the default for anything that moves. */
  base: 200,
  /** 400ms — reserved for entrances of whole surfaces. */
  slow: 400,
} as const

/** Seconds, for `motion/react`'s `transition.duration`. */
export const DURATION_S = {
  fast: DURATION_MS.fast / 1000,
  base: DURATION_MS.base / 1000,
  slow: DURATION_MS.slow / 1000,
} as const

/** `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)`. */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

/** `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
