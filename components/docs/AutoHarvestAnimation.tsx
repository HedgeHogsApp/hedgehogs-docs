'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

/**
 * AutoHarvestAnimation
 * Shows the auto-harvest strategy: LP rewards → collect → wallet
 */

const AutoHarvestAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lpNode = useRef<SVGGElement | null>(null)
  const walletNode = useRef<SVGGElement | null>(null)
  const reward1 = useRef<SVGGElement | null>(null)
  const reward2 = useRef<SVGGElement | null>(null)
  const reward3 = useRef<SVGGElement | null>(null)
  const harvestPath = useRef<SVGPathElement | null>(null)
  const walletGlow = useRef<SVGCircleElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'power2.inOut' },
    })

    // Phase 1: LP generates rewards (0-1.5s)
    tl.fromTo(
      lpNode.current,
      { scale: 1 },
      { scale: 1.15, duration: 0.6, ease: 'power2.out' },
      0
    )

    // Rewards emerge
    if (reward1.current && reward2.current && reward3.current) {
      tl.fromTo(
        [reward1.current, reward2.current, reward3.current],
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: 'back.out(2)',
        },
        0.6
      )

      // Phase 2: Rewards move to wallet (1.5-4s)
      if (harvestPath.current) {
        const pathLength = harvestPath.current.getTotalLength()
        gsap.set(harvestPath.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        })
        tl.to(
          harvestPath.current,
          { strokeDashoffset: 0, duration: 1.8, ease: 'power1.inOut' },
          1.5
        )

        // Move rewards one by one
        tl.to(
          reward1.current,
          {
            duration: 1.8,
            motionPath: {
              path: harvestPath.current,
              align: harvestPath.current,
              alignOrigin: [0.5, 0.5],
            },
            ease: 'power1.inOut',
          },
          1.5
        )
        tl.to(
          reward2.current,
          {
            duration: 1.8,
            motionPath: {
              path: harvestPath.current,
              align: harvestPath.current,
              alignOrigin: [0.5, 0.5],
            },
            ease: 'power1.inOut',
          },
          1.7
        )
        tl.to(
          reward3.current,
          {
            duration: 1.8,
            motionPath: {
              path: harvestPath.current,
              align: harvestPath.current,
              alignOrigin: [0.5, 0.5],
            },
            ease: 'power1.inOut',
          },
          1.9
        )

        // Fade out rewards
        tl.to(
          [reward1.current, reward2.current, reward3.current],
          { opacity: 0, scale: 0, duration: 0.3, stagger: 0.1 },
          3.2
        )
      }
    }

    // Phase 3: Wallet glows (3.5-5s)
    if (walletGlow.current) {
      tl.to(
        walletGlow.current,
        {
          opacity: 0.8,
          scale: 1.3,
          duration: 0.6,
          ease: 'power2.out',
        },
        3.5
      )
      tl.to(
        walletGlow.current,
        {
          opacity: 0,
          scale: 1,
          duration: 0.5,
        },
        4.8
      )
    }

    tl.to(
      walletNode.current,
      { scale: 1.2, duration: 0.4, ease: 'back.out(2)' },
      3.8
    )
    tl.to(walletNode.current, { scale: 1, duration: 0.3 }, 5.2)

    // Reset
    tl.to(lpNode.current, { scale: 1, duration: 0.3 }, 5.5)
    tl.to({}, { duration: 0.5 }, 5.8)

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
        <defs>
          <radialGradient id="harvestGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#FF9F43', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#FF9F43', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* LP Position Left */}
        <g ref={lpNode} transform="translate(100, 150)">
          <circle
            r={35}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#FF9F43',
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
            Rewards
          </text>
        </g>

        {/* Wallet Node Right */}
        <g ref={walletNode} transform="translate(300, 150)">
          <circle
            ref={walletGlow}
            cx={0}
            cy={0}
            r={35}
            fill="url(#harvestGlow)"
            opacity={0}
          />
          <circle
            r={35}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#FF9F43',
              strokeWidth: 2,
            }}
          />
          {/* Wallet icon */}
          <svg x={-16} y={-16} width={32} height={32} viewBox="0 0 640 640">
            <path
              style={{ fill: 'var(--anim-ink)' }}
              d="M128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 256C576 220.7 547.3 192 512 192L136 192C122.7 192 112 181.3 112 168C112 154.7 122.7 144 136 144L520 144C533.3 144 544 133.3 544 120C544 106.7 533.3 96 520 96L128 96zM480 320C497.7 320 512 334.3 512 352C512 369.7 497.7 384 480 384C462.3 384 448 369.7 448 352C448 334.3 462.3 320 480 320z"
            />
          </svg>
        </g>

        {/* Reward tokens */}
        <g ref={reward1} opacity={0} transform="translate(100, 120)">
          <circle r={10} fill="#FF9F43" opacity={0.9} />
          <text
            fontSize={12}
            fill="white"
            textAnchor="middle"
            dy={4}
            fontWeight={700}
          >
            $
          </text>
        </g>
        <g ref={reward2} opacity={0} transform="translate(120, 110)">
          <circle r={10} fill="#FF9F43" opacity={0.9} />
          <text
            fontSize={12}
            fill="white"
            textAnchor="middle"
            dy={4}
            fontWeight={700}
          >
            $
          </text>
        </g>
        <g ref={reward3} opacity={0} transform="translate(80, 110)">
          <circle r={10} fill="#FF9F43" opacity={0.9} />
          <text
            fontSize={12}
            fill="white"
            textAnchor="middle"
            dy={4}
            fontWeight={700}
          >
            $
          </text>
        </g>

        {/* Harvest path */}
        <path
          ref={harvestPath}
          d="M 135,140 Q 200,100 265,140"
          fill="none"
          stroke="#FF9F43"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Label */}
        <text
          x={200}
          y={270}
          fontSize={16}
          fontWeight={700}
          style={{ fill: '#FF9F43' }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Auto Harvest
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
          Claim rewards at optimal times
        </text>
      </svg>
    </div>
  )
}

export default AutoHarvestAnimation
