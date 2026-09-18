'use client'
/**
 * Capital-routing scene — a beat inside the AutopilotDemo scroll story
 * ("Your capital does double duty"). One deposit does double duty: token coins
 * (the LP's own ETH/USDC) stream out of the LP position and route along two
 * curved rails — one to back a loan as collateral, one to fund a perp margin.
 * As the coins arrive, each destination's number counts up and its fill bar
 * rises.
 *
 * It is a pure, progress-driven scene: pass a 0..1 `progress` MotionValue and
 * the whole thing scrubs off it (AutopilotDemo feeds the within-step scroll
 * progress; a constant 1 renders the fully-settled state for reduced motion).
 *
 * Craft:
 *  - ONE normalised coordinate space (x,y in 0..1) is the single source of
 *    truth. The stage aspect is locked to 5:3, the SVG rails use viewBox
 *    "0 0 100 60", the HTML nodes are placed with left/top %, and the coins
 *    are translated by (bezier(t) · measuredSize). All three layers align at
 *    every breakpoint because they share that space.
 *  - Coins move via GPU transforms only (x/y), never layout. Rails draw in via
 *    framer-motion `pathLength`. Counters/fill/pulse are all `useTransform`
 *    off the same progress — nothing is left unsynced. Only the <Counter>
 *    spans hold state, so the scene tree never re-renders per frame.
 *
 * Everything is divs/SVG on semantic tokens — crisp at any DPI, nothing to load.
 */
import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { TrendingUp } from 'lucide-react'
import CryptoIcon from '@/components/CryptoIcon'
import DexIcon from '@/components/DexIcon'

/* ─────────────────────────── scene geometry ───────────────────────────
 * Normalised anchors (x,y ∈ 0..1). The stage is locked to a 5:3 box so
 * y·(3/5) of the width is the pixel height. Coins, rails and cards all read
 * from these numbers. */

// Anchors are held in from the edges (0.2 / 0.8) so the fixed-width node cards
// clear the viewport down to ~320px once the stage carries the standard gutter.
const LP = { x: 0.2, y: 0.5 } // source: the LP position
const LOAN = { x: 0.8, y: 0.245 } // destination A: loan collateral
const PERP = { x: 0.8, y: 0.755 } // destination B: perp margin

// Cubic bezier control points for each rail (LP → destination). The rails
// bow outward from a shared throat near the LP node so the split reads clearly.
const RAIL_LOAN = [LP, { x: 0.46, y: 0.5 }, { x: 0.63, y: 0.245 }, LOAN] as const
const RAIL_PERP = [LP, { x: 0.46, y: 0.5 }, { x: 0.63, y: 0.755 }, PERP] as const

type Pt = { x: number; y: number }
type Rail = readonly [Pt, Pt, Pt, Pt]

/** Cubic-bezier point at t ∈ 0..1. */
function bezier(rail: Rail, t: number, axis: 'x' | 'y'): number {
  const u = 1 - t
  const [p0, p1, p2, p3] = rail
  return (
    u * u * u * p0[axis] +
    3 * u * u * t * p1[axis] +
    3 * u * t * t * p2[axis] +
    t * t * t * p3[axis]
  )
}

/** Build the SVG `d` for a rail in the 0..100 × 0..60 viewBox space. */
function railPath(rail: Rail): string {
  const [p0, p1, p2, p3] = rail
  const X = (v: number) => (v * 100).toFixed(2)
  const Y = (v: number) => (v * 60).toFixed(2)
  return `M ${X(p0.x)} ${Y(p0.y)} C ${X(p1.x)} ${Y(p1.y)} ${X(p2.x)} ${Y(p2.y)} ${X(p3.x)} ${Y(p3.y)}`
}

/* ─────────────────────────── coin schedule ───────────────────────────
 * A stream, not a blob: each coin gets a staggered [start,end] progress window
 * and a destination rail. Alternating rails at the throat = visible split. */

type CoinSpec = {
  symbol: string
  rail: Rail
  start: number
  end: number
  size: number
}

const FLOW_START = 0.16
// The coins are the LP's own assets (ETH / USDC) — nothing else can flow out of
// an ETH/USDC position. Alternating keeps both tokens on both rails.
const COIN_SYMBOLS = ['USDC', 'ETH', 'USDC', 'ETH', 'USDC', 'ETH', 'USDC', 'ETH']

const COINS: CoinSpec[] = COIN_SYMBOLS.map((symbol, i) => {
  const stagger = 0.05
  const start = FLOW_START + i * stagger
  return {
    symbol,
    rail: i % 2 === 0 ? RAIL_LOAN : RAIL_PERP,
    start,
    end: Math.min(0.92, start + 0.3),
    size: i % 3 === 0 ? 26 : 22,
  }
})

// A destination is only "fully funded" once the LAST coin on its rail has
// arrived — derive each rail's end from the real coin schedule so the fill
// bar / counter never top out while a coin is still visibly in flight.
const LOAN_END = Math.max(...COINS.filter((c) => c.rail === RAIL_LOAN).map((c) => c.end))
const PERP_END = Math.max(...COINS.filter((c) => c.rail === RAIL_PERP).map((c) => c.end))
const LOAN_FILL: [number, number] = [0.2, LOAN_END]
const PERP_FILL: [number, number] = [0.28, PERP_END]

/* ─────────────────────────── a single coin ─────────────────────────── */

function Coin({
  spec,
  progress,
  width,
}: {
  spec: CoinSpec
  progress: MotionValue<number>
  width: MotionValue<number>
}) {
  // t: 0→1 across this coin's window.
  const t = useTransform(progress, [spec.start, spec.end], [0, 1], { clamp: true })
  const x = useTransform([t, width], ([tv, w]: number[]) => bezier(spec.rail, tv, 'x') * w - spec.size / 2)
  const y = useTransform(
    [t, width],
    ([tv, w]: number[]) => bezier(spec.rail, tv, 'y') * (w * 0.6) - spec.size / 2
  )
  // Fade in as it leaves the LP, dissolve into the destination on arrival.
  const opacity = useTransform(t, [0, 0.08, 0.82, 1], [0, 1, 1, 0])
  const scale = useTransform(t, [0, 0.12, 1], [0.7, 1, 0.82])

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full ring-2 ring-surface-page/80 shadow-panel-elevated"
      style={{ x, y, opacity, scale, width: spec.size, height: spec.size }}
    >
      <CryptoIcon symbol={spec.symbol} size={spec.size} />
    </motion.span>
  )
}

/* ─────────────────────────── destination node ─────────────────────────── */

function DestinationNode({
  anchor,
  align,
  icon,
  label,
  sublabel,
  value,
  fill,
  pulse,
}: {
  anchor: Pt
  align: 'top' | 'bottom'
  icon: React.ReactNode
  label: string
  sublabel: string
  value: React.ReactNode
  fill: MotionValue<number>
  pulse: MotionValue<number>
}) {
  return (
    <motion.div
      className="absolute w-[132px] sm:w-[190px]"
      // Centre on the anchor via framer's own x/y — a Tailwind -translate class
      // would be clobbered by the transform framer writes for `scale`.
      style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%`, x: '-50%', y: '-50%', scale: pulse }}
    >
      <div className="rounded-2xl border border-line bg-surface-panel/90 p-3 shadow-panel-elevated backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-card text-fg-secondary">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-fg-primary">{label}</p>
            <p className="truncate text-[10.5px] text-fg-muted">{sublabel}</p>
          </div>
        </div>
        <p className="mt-2.5 font-data text-lg font-semibold tabular-nums text-fg-primary">{value}</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full origin-left rounded-full bg-brand" style={{ scaleX: fill }} />
        </div>
      </div>
      <span
        aria-hidden
        className={`absolute left-6 h-2 w-2 -translate-x-1/2 rotate-45 border-line bg-surface-panel/90 ${
          align === 'top' ? '-bottom-1 border-b border-r' : '-top-1 border-l border-t'
        }`}
      />
    </motion.div>
  )
}

/* ─────────────────────────── counter ─────────────────────────── */

/**
 * Progress-driven number that counts up to `target`. It owns its own state so
 * only this <span> re-renders per frame — the scene tree (rails, coins, nodes)
 * stays subscription-only and never re-renders. State is seeded from the
 * transform's CURRENT value so a settled (progress=1) mount shows the target
 * immediately, before any 'change' fires.
 */
function Counter({
  progress,
  range,
  target,
  format,
}: {
  progress: MotionValue<number>
  range: [number, number]
  target: number
  format: (v: number) => string
}) {
  const raw = useTransform(progress, range, [0, target], { clamp: true })
  const [v, setV] = useState(() => raw.get())
  useMotionValueEvent(raw, 'change', setV)
  return <span>{format(v)}</span>
}

/* ─────────────────────────── the scene ─────────────────────────── */

/**
 * The capital-routing scene, driven by a 0..1 `progress` MotionValue. Render it
 * inside a padded (px-4/px-6) container so the edge-anchored node cards clear
 * narrow viewports.
 */
export function RoutingScene({ progress }: { progress: MotionValue<number> }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const width = useMotionValue(640)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => width.set(el.getBoundingClientRect().width || 640)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  const draw = useTransform(progress, [0.02, 0.16], [0, 1], { clamp: true })
  const loanFill = useTransform(progress, LOAN_FILL, [0, 1], { clamp: true })
  const perpFill = useTransform(progress, PERP_FILL, [0, 1], { clamp: true })
  // Arrival pulses (subtle, no glow) fire as each destination tops out — keyed
  // to the same rail end as its fill so they land with the last coin.
  const loanPulseRaw = useTransform(progress, [LOAN_END - 0.06, LOAN_END, LOAN_END + 0.06], [1, 1.035, 1])
  const perpPulseRaw = useTransform(progress, [PERP_END - 0.06, PERP_END, PERP_END + 0.06], [1, 1.035, 1])
  const loanPulse = useSpring(loanPulseRaw, { stiffness: 220, damping: 18 })
  const perpPulse = useSpring(perpPulseRaw, { stiffness: 220, damping: 18 })

  const lpScale = useTransform(progress, [0, 0.12], [0.94, 1])

  return (
    <div ref={stageRef} className="relative mx-auto aspect-[5/3] w-full max-w-3xl">
      {/* Rails */}
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {[RAIL_LOAN, RAIL_PERP].map((rail, i) => (
          <g key={i}>
            <path d={railPath(rail)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
            <motion.path
              d={railPath(rail)}
              fill="none"
              stroke="rgb(var(--brand))"
              strokeOpacity={0.55}
              strokeWidth={0.7}
              strokeLinecap="round"
              style={{ pathLength: draw }}
            />
          </g>
        ))}
      </svg>

      {/* Coins */}
      {COINS.map((spec, i) => (
        <Coin key={i} spec={spec} progress={progress} width={width} />
      ))}

      {/* Source: LP position */}
      <motion.div
        className="absolute"
        style={{ left: `${LP.x * 100}%`, top: `${LP.y * 100}%`, x: '-50%', y: '-50%', scale: lpScale }}
      >
        <div className="w-[124px] rounded-2xl border border-brand/40 bg-surface-panel/90 p-3 shadow-panel-elevated ring-1 ring-brand/20 backdrop-blur-xs sm:w-[164px]">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-brand">LP position</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex -space-x-1.5" aria-hidden>
              {['ETH', 'USDC'].map((s) => (
                <span key={s} className="rounded-full ring-2 ring-surface-panel">
                  <CryptoIcon symbol={s} size={24} />
                </span>
              ))}
            </span>
            <div>
              <p className="text-[12.5px] font-semibold text-fg-primary">ETH / USDC</p>
              <p className="font-data text-[11px] tabular-nums text-fg-muted">$40,000</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Destination A: loan collateral */}
      <DestinationNode
        anchor={LOAN}
        align="top"
        icon={<DexIcon protocol="Aave" size={16} />}
        label="Loan collateral"
        sublabel="Backs your borrow"
        value={
          <Counter
            progress={progress}
            range={LOAN_FILL}
            target={12400}
            format={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
          />
        }
        fill={loanFill}
        pulse={loanPulse}
      />

      {/* Destination B: perp margin */}
      <DestinationNode
        anchor={PERP}
        align="bottom"
        icon={<TrendingUp className="h-4 w-4 text-fg-secondary" aria-hidden />}
        label="Perp margin"
        sublabel="Funds your hedge"
        value={
          <Counter
            progress={progress}
            range={PERP_FILL}
            target={3.2}
            format={(v) => `${v.toFixed(1)}×`}
          />
        }
        fill={perpFill}
        pulse={perpPulse}
      />
    </div>
  )
}
