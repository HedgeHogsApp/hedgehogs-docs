'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

/**
 * AutoCollaterizeAnimation
 * Shows the auto-collaterize strategy: LP fees → add collateral → improve position
 */

const AutoCollaterizeAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lpNode = useRef<SVGGElement | null>(null)
  const collateralNode = useRef<SVGGElement | null>(null)
  const feeToken = useRef<SVGImageElement | null>(null)
  const collateralizePath = useRef<SVGPathElement | null>(null)
  const collateralBar = useRef<SVGRectElement | null>(null)
  const shieldIcon = useRef<SVGGElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'power2.inOut' },
    })

    // Phase 1: LP generates fee (0-1.5s)
    tl.fromTo(
      lpNode.current,
      { scale: 1 },
      { scale: 1.15, duration: 0.6, ease: 'power2.out' },
      0
    )

    if (feeToken.current) {
      tl.fromTo(
        feeToken.current,
        { opacity: 0, scale: 0, y: 0 },
        {
          opacity: 1,
          scale: 1,
          y: -30,
          duration: 0.7,
          ease: 'back.out(2)',
        },
        0.6
      )
    }

    // Phase 2: Fee moves to collateral (1.5-3.5s)
    if (collateralizePath.current && feeToken.current) {
      const pathLength = collateralizePath.current.getTotalLength()
      gsap.set(collateralizePath.current, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      })
      tl.to(
        collateralizePath.current,
        { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' },
        1.5
      )

      tl.to(
        feeToken.current,
        {
          duration: 1.5,
          motionPath: {
            path: collateralizePath.current,
            align: collateralizePath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        1.5
      )
    }

    // Phase 3: Collateral increases (3-4.5s)
    if (collateralBar.current) {
      tl.to(
        collateralBar.current,
        {
          width: 90,
          duration: 1.2,
          ease: 'power2.out',
        },
        3
      )
    }

    if (feeToken.current) {
      tl.to(feeToken.current, { opacity: 0, scale: 0, duration: 0.3 }, 3)
    }

    // Phase 4: Shield appears (4-5.5s)
    if (shieldIcon.current) {
      tl.fromTo(
        shieldIcon.current,
        { opacity: 0, scale: 0, rotation: -180 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: 'back.out(2)',
        },
        4
      )
      tl.to(shieldIcon.current, { opacity: 0, duration: 0.4 }, 5.3)
    }

    // Reset (5.5-6s)
    tl.to(lpNode.current, { scale: 1, duration: 0.3 }, 5.5)
    tl.set(collateralBar.current, { width: 50 }, 5.8)
    tl.to({}, { duration: 0.2 }, 6)

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
        {/* LP Position Left */}
        <g ref={lpNode} transform="translate(100, 150)">
          <circle
            r={35}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#96CEB4',
              strokeWidth: 2,
            }}
          />
          <text
            y={-5}
            fontSize={13}
            fontWeight={700}
            style={{ fill: 'var(--anim-ink)' }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            LP
          </text>
          <text
            y={10}
            fontSize={10}
            fontWeight={600}
            style={{ fill: 'var(--anim-ink)', opacity: 0.7 }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            Fees
          </text>
        </g>

        {/* Collateral Node Right */}
        <g ref={collateralNode} transform="translate(300, 150)">
          <rect
            x={-50}
            y={-30}
            width={100}
            height={60}
            rx={12}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#96CEB4',
              strokeWidth: 2,
            }}
          />
          <text
            y={-5}
            fontSize={12}
            fontWeight={700}
            style={{ fill: 'var(--anim-ink)' }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            Collateral
          </text>

          {/* Collateral bar */}
          <g transform="translate(0, 12)">
            <rect
              x={-45}
              y={0}
              width={90}
              height={10}
              rx={5}
              style={{
                fill: 'var(--anim-card)',
                stroke: 'var(--anim-ring)',
                strokeWidth: 1,
              }}
            />
            <rect
              ref={collateralBar}
              x={-45}
              y={0}
              width={50}
              height={10}
              rx={5}
              fill="#96CEB4"
            />
          </g>
        </g>

        {/* Fee token */}
        <image
          ref={feeToken}
          href="/icons/eth.svg"
          x={100 - 12}
          y={150 - 12}
          width={24}
          height={24}
          opacity={0}
        />

        {/* Collateralize path */}
        <path
          ref={collateralizePath}
          d="M 130,120 Q 200,80 270,120"
          fill="none"
          stroke="#96CEB4"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Shield icon */}
        <g ref={shieldIcon} transform="translate(200, 210)" opacity={0}>
          <circle r={20} fill="#96CEB4" opacity={0.2} />
          <svg x={-12} y={-12} width={24} height={24} viewBox="0 0 24 24">
            <path
              d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3zm0 18c-3.2-1-6-5.2-6-9V6.3l6-2.3 6 2.3V11c0 3.8-2.8 8-6 9z"
              fill="#96CEB4"
            />
          </svg>
        </g>

        {/* Label */}
        <text
          x={200}
          y={270}
          fontSize={16}
          fontWeight={700}
          style={{ fill: '#96CEB4' }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Auto Collaterize
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
          Optimize capital efficiency automatically
        </text>
      </svg>
    </div>
  )
}

export default AutoCollaterizeAnimation
