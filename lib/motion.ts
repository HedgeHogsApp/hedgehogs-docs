/**
 * lib/motion.ts — Hedgehog's shared motion primitives.
 *
 * Source: Interior.dev component system (ddoemonn/interior). These are the
 * exact spring / ease configs Interior ships in its micro-interaction
 * components, lifted into one place so every `components/interior/*` file
 * (and any consumer) references the SAME constants instead of re-declaring
 * them.
 *
 * They match Hedgehog's house motion contract: sub-300ms springs,
 * transform/opacity-only, absolute-exit crossfade, and a
 * `useReducedMotion` → `{ duration: 0 }` instant fallback. Phase 5
 * (Shadow plugin) is the only visual layer left untouched here.
 */

/** Generic soft crossfade (opacity/scale content swaps). */
export const CROSSFADE = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const

/** Snappy positional cell (layout shifts, list reorders). */
export const CELL = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.45,
} as const

/** Face swap inside a morphing button (HoldToConfirm / TxButton). */
export const FACE = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const

/** Wizard progress-rail spring (tiles + progress bar). */
export const RAIL = {
  type: 'spring',
  stiffness: 520,
  damping: 40,
  mass: 0.5,
} as const

/** Accordion panel disclose spring. */
export const DISCLOSE = {
  type: 'spring',
  stiffness: 480,
  damping: 40,
  mass: 0.6,
} as const

/** Accordion chevron rotation spring. */
export const CHEVRON = {
  type: 'spring',
  stiffness: 700,
  damping: 46,
  mass: 0.5,
} as const

/** ValueFlash digit roll spring. */
export const ROLL = {
  type: 'spring',
  stiffness: 460,
  damping: 32,
  mass: 0.55,
} as const

/** ValueFlash direction-glyph pop. */
export const POP = {
  type: 'spring',
  stiffness: 640,
  damping: 22,
  mass: 0.7,
} as const

/** ValueFlash container lift. */
export const LIFT = {
  type: 'spring',
  stiffness: 380,
  damping: 26,
  mass: 0.7,
} as const

/** ValueFlash settle-back spring. */
export const SETTLE = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const

/** Decelerate ease — used for enters. */
export const EASE = [0.23, 1, 0.32, 1] as const

/** Accelerate ease — used for exits. */
export const EXIT_EASE = [0.4, 0, 1, 1] as const

/** Instant transition — the `useReducedMotion` fallback everywhere. */
export const INSTANT = { duration: 0 } as const

/** ValueFlash clear transition (fast accelerate-out). */
export const CLEAR = { duration: 0.16, ease: [0.4, 0, 1, 1] } as const

/** ValueFlash digit drop transition. */
export const DROP = { duration: 0.14, ease: [0.4, 0, 1, 1] } as const

/** No-motion transition (same as INSTANT — semantic alias). */
export const STILL = { duration: 0 } as const

/**
 * §6.1 M7 — the tab-underline slide, shared by every underline tablist in the
 * app (`components/explore/ExploreHeader.tsx`, `components/portfolio/PortfolioTabs.tsx`).
 *
 * Its `duration` is deliberately NOT on `lib/motion/tokens.ts`'s `DURATION_S`
 * scale: a spring's duration is a perceptual settle time, not a transition
 * length, and 0.5s of settle is not 0.5s of movement. It is a constant here
 * rather than a literal in each strip because §7's own argument against a
 * second underline recipe on a sibling page applies just as well to a second
 * COPY of the same one — two literals drift, one constant cannot.
 *
 * Measured from `ExploreHeader.tsx` on 2026-09-04 and recorded in §6.1 M7.
 */
export const TAB_UNDERLINE = {
  type: 'spring',
  bounce: 0.18,
  duration: 0.5,
} as const

/**
 * §7 D41 — the ghost-text press, the second of the app's two press
 * vocabularies (the first is `button.tsx`'s thick-surface `translate-y-px`).
 * A text control with no fill has nothing to depress, and a translate would
 * slide the label out from under its own underline, so it scales instead.
 *
 * 120ms `easeOut`, measured from `ExploreHeader.tsx` and recorded in §6.1 M8.
 * Not on the `DURATION_S` scale either — 120ms sits between `fast` (100) and
 * `base` (200), and D41 names this number specifically.
 */
export const TAB_PRESS = { duration: 0.12, ease: 'easeOut' } as const
