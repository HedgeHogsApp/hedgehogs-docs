'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'

const REBALANCE = '#A78BFA'

/**
 * AutoRebalanceAnimation
 * Shows the auto-rebalance strategy: a ranged LP position, price drifting out
 * of the band, then the band re-centering around the current price.
 * Skeleton mirrors the other Auto* components (gsap timeline, reduced-motion
 * guard, data-motion marker).
 */

const AutoRebalanceAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const priceDot = useRef<SVGCircleElement | null>(null)
  const band = useRef<SVGRectElement | null>(null)
  const bandTop = useRef<SVGLineElement | null>(null)
  const bandBottom = useRef<SVGLineElement | null>(null)
  const labelIn = useRef<SVGTextElement | null>(null)
  const labelOut = useRef<SVGTextElement | null>(null)
  const labelDone = useRef<SVGTextElement | null>(null)

  // Price history polyline (fixed). The dot travels along its y values.
  const pricePoints = [
    [60, 200], [100, 195], [140, 198], [180, 190], [220, 185],
    [260, 178], [300, 168], [340, 155], [380, 140],
  ]

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })

    // Phase 1: IN RANGE (0-1.6s) — price moves inside the band
    tl.fromTo(priceDot.current, { attr: { cy: 200, opacity: 0 } }, { attr: { cy: 195 }, opacity: 1, duration: 0.6 }, 0)
    tl.to(priceDot.current, { attr: { cy: 190 }, duration: 0.6, ease: 'power1.inOut' }, 0.6)
    tl.to(priceDot.current, { attr: { cy: 195 }, duration: 0.4, ease: 'power1.inOut' }, 1.2)

    // Phase 2: OUT OF RANGE (1.6-3.2s) — price climbs out above the band
    tl.to(labelIn.current, { opacity: 0, duration: 0.2 }, 1.6)
    tl.to(labelOut.current, { opacity: 1, duration: 0.25 }, 1.8)
    tl.to(priceDot.current, { attr: { cy: 178 }, duration: 0.8, ease: 'power1.in' }, 1.6)
    tl.to(priceDot.current, { attr: { cy: 168 }, duration: 0.8, ease: 'power1.inOut' }, 2.4)

    // Phase 3: REBALANCED (3.2-4.8s) — band slides up to re-center on the price
    tl.to(labelOut.current, { opacity: 0, duration: 0.2 }, 3.2)
    tl.to(labelDone.current, { opacity: 1, duration: 0.25 }, 3.4)
    tl.to(band.current, { attr: { y: 140 }, duration: 0.9, ease: 'power2.out' }, 3.2)
    tl.to(bandTop.current, { attr: { y1: 125, y2: 125 }, duration: 0.9, ease: 'power2.out' }, 3.2)
    tl.to(bandBottom.current, { attr: { y1: 168, y2: 168 }, duration: 0.9, ease: 'power2.out' }, 3.2)
    // Price settles back inside
    tl.to(priceDot.current, { attr: { cy: 150 }, duration: 0.6, ease: 'power2.inOut' }, 3.4)

    // Hold, then reset
    tl.to({}, { duration: 0.8 }, 4.2)
    tl.to(labelDone.current, { opacity: 0, duration: 0.2 }, 4.6)
    tl.to(priceDot.current, { opacity: 0, duration: 0.3 }, 4.6)
    tl.to({}, { duration: 0.3 }, 4.9)

    return () => {
      tl.kill()
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="w-full h-[300px] flex justify-center items-center bg-surface-panel dark:bg-surface-page rounded-lg">
        <div className="text-fg-secondary dark:text-fg-muted text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center items-center rounded-lg bg-surface-panel dark:bg-surface-page overflow-hidden" data-motion="on">
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Axis */}
        <line x1={50} y1={235} x2={390} y2={235} stroke="var(--anim-card)" strokeWidth={2} />
        <text x={200} y={255} fontSize={11} fontWeight={600} style={{ fill: 'var(--anim-ink)', opacity: 0.6 }} textAnchor="middle" fontFamily="liebling, ui-sans-serif, system-ui">
          Price over time
        </text>

        {/* Price history */}
        <polyline
          points={pricePoints.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="var(--anim-primary)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.8}
        />

        {/* The chosen range band */}
        <rect ref={band} x={50} y={170} width={340} height={38} rx={6} fill={REBALANCE} opacity={0.16} />
        <line ref={bandTop} x1={50} y1={170} x2={390} y2={170} stroke={REBALANCE} strokeWidth={1.5} strokeDasharray="4 3" />
        <line ref={bandBottom} x1={50} y1={208} x2={390} y2={208} stroke={REBALANCE} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={58} y={163} fontSize={10} fontWeight={600} style={{ fill: REBALANCE }} fontFamily="liebling, ui-sans-serif, system-ui">
          Your range
        </text>

        {/* Current price dot */}
        <circle ref={priceDot} cx={60} cy={195} r={6} fill="var(--anim-primary)" stroke="var(--anim-card)" strokeWidth={2} opacity={0} />

        {/* Phase tags */}
        <text ref={labelIn} x={200} y={285} fontSize={16} fontWeight={700} style={{ fill: 'var(--anim-primary)' }} textAnchor="middle" fontFamily="liebling, ui-sans-serif, system-ui">
          Auto Rebalance
        </text>
        <text x={200} y={285} fontSize={16} fontWeight={700} style={{ fill: REBALANCE }} textAnchor="middle" fontFamily="liebling, ui-sans-serif, system-ui" opacity={0}>
          Rebalancing…
        </text>
        <text ref={labelOut} x={200} y={70} fontSize={13} fontWeight={700} style={{ fill: '#f59e0b' }} textAnchor="middle" fontFamily="liebling, ui-sans-serif, system-ui" opacity={0}>
          Out of range
        </text>
        <text ref={labelDone} x={200} y={70} fontSize={13} fontWeight={700} style={{ fill: 'var(--anim-primary)' }} textAnchor="middle" fontFamily="liebling, ui-sans-serif, system-ui" opacity={0}>
          Rebalanced · back in range
        </text>
      </svg>
    </div>
  )
}

export default AutoRebalanceAnimation