'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { useReducedMotion } from 'motion/react'
import { useResponsiveIconSize } from '@/hooks/useResponsiveIconSize'
import { Skeleton } from '@/components/ui_components/skeleton'

interface DexIconProps {
  protocol: string | { name: string } | null | undefined
  size?: number
  className?: string
}

// First path is local, second is remote fallback. Add new entries here as
// KyberSwap surfaces new aggregator names; matching is normalization-aware
// so "pancake-v3" / "pancakeswap_v3" / "Pancake V3" all resolve to the same
// pancakeswap entry.
const protocolToLogoMap: Record<string, [string, string]> = {
  uniswap: [
    '/dexes/uniswap.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-uniswap/public',
  ],
  uniswapv3: [
    '/dexes/uniswap.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-uniswap/public',
  ],
  sushi: [
    '/dexes/sushi.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-sushiswap/public',
  ],
  sushiswap: [
    '/dexes/sushi.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-sushiswap/public',
  ],
  thena: [
    '/dexes/thena.png',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-thena/public',
  ],
  pancake: [
    '/dexes/pancake.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-pancakeSwap/public',
  ],
  pancakeswap: [
    '/dexes/pancake.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-pancakeSwap/public',
  ],
  aerodrome: [
    '/dexes/aerodrome.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-aerodrome/public',
  ],
  velodrome: [
    '/dexes/velodrome.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-velodrome/public',
  ],
  traderjoe: [
    '/dexes/traderjoe.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-traderjoe/public',
  ],
  curve: [
    '/dexes/curve.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-curve/public',
  ],
  balancer: [
    '/dexes/balancer.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-balancer/public',
  ],
  quickswap: [
    '/dexes/quickswap.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-quickswap/public',
  ],
  camelot: [
    '/dexes/camelot.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-camelot/public',
  ],
  ramses: [
    '/dexes/ramses.svg',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-ramses/public',
  ],
  morpho: [
    '/dexes/morpho.svg',
    'https://cdn.morpho.org/assets/logos/morpho.svg',
  ],
  compound: [
    '/dexes/compound.svg',
    'https://cryptologos.cc/logos/compound-comp-logo.svg',
  ],
  yearn: [
    '/dexes/yearn.svg',
    'https://cryptologos.cc/logos/yearn-finance-yfi-logo.svg',
  ],
  aave: [
    '/dexes/aave.svg',
    'https://cryptologos.cc/logos/aave-aave-logo.svg',
  ],
  baseswap: [
    '/dexes/baseswap.png',
    'https://imagedelivery.net/tLQGX6fO2lhA7EXY2jvPQQ/project-baseswap/public',
  ],
}

// Normalize a raw protocol string to a lookup key. Strips whitespace, case,
// version suffixes (`-v3`, `_v2`, `v3`), and connector chars so the map can
// stay small.
function normalize(raw: string): string {
  return raw
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/[-_]?v[0-9.]+$/, '')
    .replace(/[-_]/g, '')
}

function resolveLogo(raw: string): [string, string] | null {
  const key = normalize(raw)
  if (!key) return null

  const direct = protocolToLogoMap[key]
  if (direct) return direct

  // Prefix match — KyberSwap occasionally returns combined names like
  // "pancakeswap-stable" or "uniswap-fork"; matching either direction
  // catches both shorter and longer variants.
  for (const [mapKey, value] of Object.entries(protocolToLogoMap)) {
    if (key === mapKey) return value
    if (key.startsWith(mapKey) || mapKey.startsWith(key)) return value
  }

  return null
}

export default function DexIcon({
  protocol,
  size = 16,
  className = '',
}: DexIconProps) {
  const [errored, setErrored] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const responsiveSize = useResponsiveIconSize(size)
  const reduce = useReducedMotion()

  const protocolString =
    typeof protocol === 'string'
      ? protocol
      : typeof protocol === 'object' && protocol !== null && 'name' in protocol
      ? protocol.name
      : ''

  const logoData = useMemo(
    () => (protocolString ? resolveLogo(protocolString) : null),
    [protocolString]
  )

  // No mapped logo, or every loader has errored: render nothing. The pill
  // text already conveys the protocol — a missing icon beats a fake one.
  if (!logoData || errored) return null

  const logoPath = useFallback ? logoData[1] : logoData[0]

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: responsiveSize, height: responsiveSize }}
      data-motion={reduce ? 'off' : 'on'}
    >
      {!loaded && <Skeleton className="absolute inset-0 rounded-full" />}
      <Image
        src={logoPath}
        alt={`${protocolString} logo`}
        width={responsiveSize}
        height={responsiveSize}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false)
          if (!useFallback) {
            setUseFallback(true)
          } else {
            // Every loader has errored: render nothing (handled by the
            // `!logoData || errored` guard above on the next render). The
            // pill text already conveys the protocol — a missing icon beats
            // a fake one, and "nothing" is a stable terminal state, not an
            // indefinite skeleton.
            setErrored(true)
          }
        }}
        className={`rounded-full transition-opacity duration-150 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } motion-reduce:transition-none`}
      />
    </div>
  )
}
