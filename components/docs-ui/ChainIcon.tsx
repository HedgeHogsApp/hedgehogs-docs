'use client'

import Image from 'next/image'

const CHAIN_ASSETS: Record<string, string> = {
  mainnet: '/chains/eth.svg',
  eth: '/chains/eth.svg',
  ethereum: '/chains/eth.svg',
  base: '/chains/base.svg',
  bsc: '/chains/bsc.svg',
  'bnb': '/chains/bsc.svg',
  arbitrum: '/chains/arbitrum.svg',
  optimism: '/chains/optimism.svg',
  polygon: '/chains/polygon.svg',
}

interface ChainIconProps {
  chain: string
  size?: number
  className?: string
}

/** Chain mark with a local SVG (and a letter fallback if the asset is missing). */
export function ChainIcon({ chain, size = 18, className }: ChainIconProps) {
  const asset = CHAIN_ASSETS[chain.toLowerCase()]
  if (!asset) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full bg-surface-card font-semibold uppercase text-fg-muted ${className ?? ''}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {chain[0]}
      </span>
    )
  }
  return (
    <span aria-hidden className={`inline-flex shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <Image src={asset} alt="" width={size} height={size} className="rounded-full" />
    </span>
  )
}

export default ChainIcon