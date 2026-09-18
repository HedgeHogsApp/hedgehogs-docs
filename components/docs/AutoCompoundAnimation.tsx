'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

/**
 * AutoCompoundAnimation
 * Shows the auto-compound strategy: fees → reinvest → grow
 */

const AutoCompoundAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lpNode = useRef<SVGGElement | null>(null)
  const lpCircle = useRef<SVGCircleElement | null>(null)
  const feeToken = useRef<SVGImageElement | null>(null)
  const returnPath = useRef<SVGPathElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'power2.inOut' },
    })

    // Phase 1: LP generates yield/fees (0-0.8s)
    // Pulse the LP to show it's generating yield
    tl.to(
      lpNode.current,
      { scale: 1.08, duration: 0.6, ease: 'power2.out' },
      0
    )

    // Fee emerges from the LP itself (showing yield generation)
    if (feeToken.current && returnPath.current) {
      // Start hidden
      tl.set(feeToken.current, { opacity: 0 }, 0)

      // Show fee emerging from LP
      tl.to(
        feeToken.current,
        {
          opacity: 1,
          duration: 0.3,
        },
        0.6
      )

      // Phase 2: Fee loops around LP (0.9-3.5s)

      // Animate along the circular path
      tl.to(
        feeToken.current,
        {
          duration: 2.6,
          motionPath: {
            path: returnPath.current,
            align: returnPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'none',
        },
        0.9
      )

      // Fade out as it merges back with LP
      tl.to(
        feeToken.current,
        { opacity: 0, duration: 0.3 },
        3.2
      )
    }

    // Phase 3: LP grows (3.5-5.2s)
    if (lpCircle.current) {
      tl.to(
        lpCircle.current,
        {
          attr: { r: 50 },
          duration: 1.0,
          ease: 'power2.out',
        },
        3.5
      )

      // Hold the growth
      tl.to({}, { duration: 0.7 }, 4.5)

      // Reset size
      tl.to(
        lpCircle.current,
        {
          attr: { r: 40 },
          duration: 0.3,
        },
        5.2
      )
    }

    // Reset LP scale
    tl.to(lpNode.current, { scale: 1, duration: 0.3 }, 5.2)
    tl.to({}, { duration: 0.3 }, 5.5)

    return () => {
      tl.kill()
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="w-full h-[300px] flex justify-center items-center bg-surface-panel dark:bg-surface-page rounded-lg">
        <div className="text-fg-secondary dark:text-fg-muted text-sm">
          Loading...
        </div>
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
        {/* LP Position Center */}
        <g ref={lpNode} transform="translate(200, 150)">
          <circle
            ref={lpCircle}
            r={40}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#FF6B6B',
              strokeWidth: 2,
            }}
          />
          <text
            y={-8}
            fontSize={14}
            fontWeight={700}
            style={{ fill: 'var(--anim-ink)' }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            LP
          </text>
          <text
            y={8}
            fontSize={11}
            fontWeight={600}
            style={{ fill: 'var(--anim-ink)', opacity: 0.7 }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            Position
          </text>
        </g>

        {/* Fee token looping around LP */}
        <image
          ref={feeToken}
          href="/icons/usdc.svg"
          x={200 - 12}
          y={90 - 12}
          width={24}
          height={24}
          opacity={0}
        />

        {/* Circular path around LP (invisible guide for motion) */}
        <path
          ref={returnPath}
          d="M 200,90
             A 60,60 0 0,1 260,150
             A 60,60 0 0,1 200,210
             A 60,60 0 0,1 140,150
             A 60,60 0 0,1 200,90 Z"
          fill="none"
          stroke="none"
        />

        {/* Label */}
        <text
          x={200}
          y={270}
          fontSize={16}
          fontWeight={700}
          style={{ fill: '#FF6B6B' }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Auto Compound
        </text>
        <text
          x={200}
          y={288}
          fontSize={11}
          fontWeight={600}
          style={{ fill: 'var(--anim-ink)', opacity: 0.6 }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Reinvest fees for exponential growth
        </text>
      </svg>
    </div>
  )
}

export default AutoCompoundAnimation
