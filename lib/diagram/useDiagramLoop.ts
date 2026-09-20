'use client'

import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame, useInView, useMotionValue } from 'motion/react'

export interface UseDiagramLoopOptions {
  /** Loop period in ms (one full 0→1 pass). */
  period?: number
  /** Start looping only when the diagram scrolls into view (still loops forever once seen). */
  gateOnView?: boolean
  /** Fraction of the viewport that must be visible to start. */
  amount?: number
}

/** Fresh read of `prefers-reduced-motion` (per mount, tracks changes). */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      : false
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const fn = () => setReduce(mq.matches)
    fn()
    mq.addEventListener?.('change', fn)
    return () => mq.removeEventListener?.('change', fn)
  }, [])
  return reduce
}

/**
 * The shared diagram engine. Drives a single `t ∈ [0,1)` MotionValue that loops
 * forever once the diagram is in view (autoplay + loopable), and snaps to `1`
 * under `prefers-reduced-motion` so every diagram renders its **complete final
 * frame statically**.
 *
 * Contract for diagram components:
 * - Static JSX renders the full structure (nodes, labels, tracks, captions).
 * - Only the *transient/result* layer derives from `t` (token positions, bar
 *   fills, band placement) via `useTransform(t, window, value, { clamp: true })`,
 *   with windows ending before `t ≈ 0.95` so the 1→0 wrap is invisible.
 * - Under reduced motion `t` stays 1: the result-state layer is at its final
 *   value, the transient tokens are hidden — a complete, calm diagram.
 */
export function useDiagramLoop({
  period = 5200,
  gateOnView = true,
  amount = 0.35,
}: UseDiagramLoopOptions = {}) {
  const scope = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()
  const inView = useInView(scope, { once: true, amount })
  const t = useMotionValue(reduce ? 1 : 0)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    if (gateOnView && !inView) return
    const next = t.get() + delta / period
    t.set(next >= 1 ? next % 1 : next)
  })

  // If the user turns reduced motion on mid-flight, settle to the complete frame.
  useEffect(() => {
    if (reduce) t.set(1)
  }, [reduce, t])

  return { scope, t, reduce }
}

export type { MotionValue } from 'motion/react'