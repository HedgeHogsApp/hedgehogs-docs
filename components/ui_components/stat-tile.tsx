'use client'

/**
 * `<StatTile>` — THE shared KPI/stat tile.
 *
 * One visual shell for every page-header KPI (Overview health strip,
 * Strategies summary, Vaults discovery, Portfolio positions): label over a
 * large data-face (Inter) tabular-nums value, optional delta badge + icon
 * chip, muted sub-line, on the standard `rounded-lg border-line bg-surface-card`
 * card. Previously four near-identical local renderers; unify here instead
 * of forking a new one.
 *
 * Usage:
 * ```tsx
 * <StatTileGrid>
 *   <StatTile label="Net value" value="$2,593,678" sub="+1.62% · 24h" subTone="success" />
 *   <StatTile label="Rewards" value="$18.42K" countUpTo={18421} href="/rewards" tone="brand" />
 *   <StatTile label="Total supplied" value="$1.2B" icon={<Wallet size={16} />} delta="+1.2%" deltaTone="success" />
 * </StatTileGrid>
 * ```
 *
 * KPI recipe (ported from the shadcn-dashboard admin template):
 *   label (`text-sm text-fg-secondary`) → value (`font-data text-2xl
 *   font-semibold tracking-tight tabular-nums`) → delta badge
 *   (`bg-<tone>/10 text-<tone>` pill) → optional caption. The icon chip is a
 *   16px lucide icon in a `border border-line p-2.5 rounded-md` square, docked
 *   to the top-right of the card.
 *
 * `variant="cell"` swaps the tile into a TotalAssets-style 2×2 cell:
 *   value-over-label (reversed from the card) with the icon chip in-flow at
 *   the top. Pair it with `<StatTileGrid variant="assets">`, whose
 *   `gap-px bg-border` hairline grid provides the separators.
 *
 * TONE RULES (from the design spec): brand cyan marks INTERACTIVE/CTA
 * emphasis, never data emphasis. Use `tone="success" | "warning" | "danger" |
 * "borrow"` for status readings (health factor, positive APY, at-risk values,
 * debt) and
 * reserve `tone="brand"` for tiles that deep-link to an action (i.e. tiles
 * with an `href`). A plain figure — however important — stays `default`.
 *
 * Motion: pages stagger tiles via framer-motion `staggerChildren`; pass the
 * page's item `variants` so the tile participates. Omit it for static mounts.
 */

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'
import { formatUSDValue } from '@/utils/format'

export type StatTileTone =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  /**
   * Debt. A STATUS tone in the shared `entity-row` vocabulary, not a new one:
   * it marks the figure that SUBTRACTS. Used by the Portfolio's Debt tile so
   * the Collateral / LP / Debt grid reads as the equation producing net worth
   * (T11b) rather than three interchangeable positive numbers.
   */
  | 'borrow'
export type StatTileSubTone = 'muted' | 'success' | 'brand'
export type StatTileDeltaTone = 'success' | 'danger' | 'warning' | 'muted'

/**
 * The repo-wide marker for a value we do not have. A tone is EMPHASIS on a
 * real figure, so an absent one must never carry it: a green em-dash reads as
 * a reward that exists, a red one as a cost that exists. Missing is muted,
 * whatever tone the caller asked for.
 */
export const MISSING_VALUE = '—'

/** Text-color class per value tone — exported for the pages' condensed mobile strips. */
export const STAT_TILE_TONE_TEXT: Record<StatTileTone, string> = {
  default: 'text-fg-primary',
  brand: 'text-brand',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  borrow: 'text-borrow',
}

const SUB_TONE_TEXT: Record<StatTileSubTone, string> = {
  muted: 'text-fg-muted',
  success: 'text-success',
  brand: 'text-brand/80',
}

/** Delta badge fill/text — the KPI pill recipe (`bg-<tone>/10 text-<tone>`). */
const DELTA_TONE: Record<StatTileDeltaTone, string> = {
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-surface-panel text-fg-muted',
}

/** The icon chip square — 16px lucide icon in a bordered 36px box. */
const ICON_CHIP_CLASS =
  'grid place-items-center rounded-md border border-line p-2.5 text-fg-secondary'

/**
 * Count-up tween for a USD value that changes in place (e.g. lifetime
 * rewards). No animation library: a single rAF loop tweens the displayed
 * number from its previous value to the new target over ~700ms, ease-out
 * cubic. Respects `prefers-reduced-motion` (jumps straight to target).
 *
 * `target` is the numeric figure the tile's `value` string was formatted
 * from (via `formatUSDValue`), so the tween's FINAL frame renders the SAME
 * string the static fallback would. When `target` is undefined the hook is
 * inert and the caller renders the static string.
 */
export function useCountUp(target: number | undefined): number | null {
  const reduce = useReducedMotion()
  const [display, setDisplay] = React.useState<number | null>(target ?? null)
  const fromRef = React.useRef<number>(target ?? 0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (target == null) {
      setDisplay(null)
      return
    }
    if (reduce) {
      fromRef.current = target
      setDisplay(target)
      return
    }
    const from = fromRef.current
    const to = target
    if (from === to) {
      setDisplay(to)
      return
    }
    const DURATION = 700
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from + (to - from) * eased
      setDisplay(v)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, reduce])

  return display
}

export interface StatTileProps {
  /** KPI label — secondary text over the value (card) or under it (cell). */
  label: string
  /** Large data-face tabular-nums figure. */
  value: string | React.ReactNode
  /** Muted caption under the value. */
  sub?: string | React.ReactNode
  /** Color role for the VALUE text — see tone rules in the file header. */
  tone?: StatTileTone
  /** Color role for the sub-line (default muted). */
  subTone?: StatTileSubTone
  /** Optional leading status dot on the sub-line. */
  dot?: 'success'
  /** Whole tile becomes a link with hover affordance (rewards → claim flow). */
  href?: string
  /** Native tooltip footnote (e.g. "N runs unpriced — not counted"). */
  title?: string
  /**
   * When set, the value animates a count-up on CHANGE via `useCountUp`;
   * must be the numeric target `value` was formatted from (formatUSDValue)
   * so the tween lands EXACTLY on the displayed string. Omitted ⇒ static.
   */
  countUpTo?: number
  /** Quiet action docked under the sub-line (e.g. "Exit everything"). */
  action?: React.ReactNode
  /**
   * KPI delta badge next to the value (e.g. "+1.2%") — the admin-template
   * pill recipe (`bg-<tone>/10 text-<tone>`, rounded-full). Static by design:
   * callers compute the figure; there is no built-in trend source.
   */
  delta?: string
  /** Color role for the delta badge (default success). */
  deltaTone?: StatTileDeltaTone
  /** 16px lucide icon in the bordered chip — docked top-right (card) or
   *  in-flow at the top (cell). Omit for a plain tile. */
  icon?: React.ReactNode
  /** `card` (default) = label-over-value KPI tile. `cell` = TotalAssets
   *  value-over-label cell for a hairline 2×2 grid. */
  variant?: 'card' | 'cell'
  /** framer-motion stagger item variants from the page container. */
  variants?: Variants
  className?: string
  'data-testid'?: string
}

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
  subTone = 'muted',
  dot,
  href,
  title,
  countUpTo,
  action,
  delta,
  deltaTone = 'success',
  icon,
  variant = 'card',
  variants,
  className,
  'data-testid': testId,
}: StatTileProps) {
  // A tone is emphasis on a REAL figure. When the value is the missing
  // marker there is no figure to emphasise, so the tone is dropped rather
  // than painting an em-dash green (a reward that isn't there) or red (a
  // cost that isn't there). Callers stay free to pass their natural tone.
  const valueTone: StatTileTone = value === MISSING_VALUE ? 'default' : tone

  // Tiles with an href are real links ("Harvest available →" must DO
  // something) — same card chrome, plus hover affordance.
  const Tag = href ? motion.a : motion.div
  const counted = useCountUp(countUpTo)
  const displayValue =
    countUpTo != null && counted != null ? formatUSDValue(counted) : value

  // The KPI value + inline delta badge — a baseline row so a long figure
  // wraps the badge onto its own line instead of clipping.
  const valueRow = (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span
        className={cn(
          'font-data text-2xl font-semibold tracking-tight tabular-nums',
          STAT_TILE_TONE_TEXT[valueTone],
        )}
      >
        {displayValue}
      </span>
      {delta != null && (
        <span
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
            DELTA_TONE[deltaTone],
          )}
        >
          {delta}
        </span>
      )}
    </div>
  )

  return (
    <Tag
      variants={variants}
      {...(href ? { href } : {})}
      {...(title ? { title } : {})}
      {...(testId ? { 'data-testid': testId } : {})}
      className={cn(
        'relative block rounded-lg border border-line bg-surface-card p-4',
        variant === 'cell' &&
          'flex h-full flex-col justify-between gap-3 rounded-none border-0',
        href && 'transition-colors hover:border-line-brand/40 hover:bg-surface-card-hover',
        // The docked icon chip occupies the top-right ~52px — clear it so the
        // label/value never slide underneath.
        icon != null && variant !== 'cell' && 'pr-14',
        className,
      )}
    >
      {variant === 'cell' ? (
        /* TotalAssets cell — icon chip in-flow at the top, value OVER label. */
        <>
          {icon != null && (
            <span className={`w-fit ${ICON_CHIP_CLASS}`} aria-hidden="true">
              {icon}
            </span>
          )}
          <div>
            <div
              className={cn(
                'font-data text-2xl font-semibold tracking-tight tabular-nums',
                STAT_TILE_TONE_TEXT[valueTone],
              )}
            >
              {displayValue}
            </div>
            <div className="mt-1 text-sm text-fg-secondary">{label}</div>
          </div>
        </>
      ) : (
        /* KPI card — label OVER value, delta badge inline, sub + action below. */
        <>
          <div className="text-sm text-fg-secondary">{label}</div>
          <div className="mt-2">{valueRow}</div>
          {sub != null && (
            <div
              className={cn(
                'mt-1 flex items-center gap-1.5 text-[11px] tabular-nums',
                SUB_TONE_TEXT[subTone],
              )}
            >
              {dot === 'success' && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
              {sub}
            </div>
          )}
          {action != null && <div className="mt-2.5">{action}</div>}
        </>
      )}
      {icon != null && variant !== 'cell' && (
        <span className={`absolute right-4 top-4 ${ICON_CHIP_CLASS}`} aria-hidden="true">
          {icon}
        </span>
      )}
    </Tag>
  )
}

/** The shared responsive KPI row every page uses: 2-up, 4-up from lg. */
export function StatTileGrid({
  className,
  children,
  variant = 'default',
}: {
  className?: string
  children: React.ReactNode
  /** `assets` = the TotalAssets 2×2 hairline grid (gap-px bg-border). */
  variant?: 'default' | 'assets'
}) {
  return (
    <div
      className={cn(
        variant === 'assets'
          ? 'grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-border'
          : 'grid grid-cols-2 gap-3 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
