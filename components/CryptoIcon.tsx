'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useReducedMotion } from 'motion/react'
import { useResponsiveIconSize } from '@/hooks/useResponsiveIconSize'
import { useTokens } from '@/contexts/TokensContext'
import { Skeleton } from '@/components/ui_components/skeleton'

/**
 * R2 fix wave (B5) — token symbols with no file in `public/icons` whose logo
 * already ships in the app. AERO (Aerodrome's token) requested
 * `/icons/aero.svg` on every page that listed it and logged a 404 before the
 * `onError` chain could fall back; Aerodrome's logo is `public/dexes/aerodrome.svg`,
 * the same file `DexIcon` draws.
 */
const LOCAL_ICON_ALIASES: Record<string, string> = {
  aero: '/dexes/aerodrome.svg',
}

/**
 * Maps chainId → Trust Wallet CDN chain slug.
 * Used for address-based icon fallback.
 */
const CHAIN_SLUG: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  56: 'smartchain',
  137: 'polygon',
  8453: 'base',
  42161: 'arbitrum',
  43114: 'avalanchec',
}

/**
 * A symbol is safe to use as the basename of a local SVG icon
 * (`/icons/<sym>.svg`) only when it looks like a real token ticker — short,
 * alphanumeric, and free of address-ish characters.
 *
 * We reject:
 *   - empty / whitespace-only strings
 *   - anything containing `0x` (truncated address)
 *   - anything containing `…` or `...` (truncation marker)
 *   - strings longer than 12 characters (real tickers are ≤ 11)
 *   - strings containing characters URL-encoders mangle (whitespace,
 *     non-ASCII, `/`, `?`, `#`, `:`)
 *
 * Without this guard, code paths that fall back to e.g. `pos.pool.slice(0, 8)`
 * or `${pos.token0.slice(0, 6)}…` as a "symbol" caused 27 distinct
 * `/icons/0x….svg` 404s on the live VPS demo. Now those fall through
 * directly to the address/CDN fallback chain (or the generic-token SVG)
 * with no wasted request.
 *
 * Exported via the named export below for unit testing.
 */
export function isLocalIconSafe(symbol: string): boolean {
  if (!symbol) return false
  const s = symbol.trim()
  if (!s || s.length > 12) return false
  // Truncated-address / placeholder shapes
  if (s.startsWith('0x') || s.startsWith('0X')) return false
  if (s.includes('…') || s.includes('...')) return false
  // File-name / URL-hostile characters — anything outside [A-Za-z0-9_-]
  // can be URL-encoded by the browser and produce a 404.
  return /^[A-Za-z0-9_-]+$/.test(s)
}

interface CryptoIconProps {
  symbol?: string
  size?: number
  className?: string
  logoUrl?: string // Optional logoUrl from backend
  address?: string // Token contract address for CDN fallbacks
  chainId?: number // Chain ID for CDN fallbacks
}

/**
 * Token icon with multi-level fallback:
 * 0. Explicit logoUrl prop / TokensContext logoUrl
 * 1. Local SVG by symbol (/icons/{symbol}.svg)
 * 2. SmolDapp CDN by chainId + address
 * 3. Trust Wallet CDN by chain slug + address
 * 4. Server resolver /api/token-icon (CoinGecko + DexScreener)
 * 5. Generic token icon
 */
const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol = 'unknown',
  size = 32,
  className = '',
  logoUrl,
  address: addressProp,
  chainId: chainIdProp,
}) => {
  const fallbackSrc = '/icons/generic-token.svg'
  const { getTokenIcon, tokens } = useTokens()
  const responsiveSize = useResponsiveIconSize(size)

  // Auto-lookup address & chainId from TokensContext when not explicitly passed.
  // This enables CDN fallbacks (SmolDapp, TrustWallet, CoinGecko) even when
  // callers only pass symbol — which covers pools, loans, vaults, dashboard, etc.
  const { address, chainId } = useMemo(() => {
    if (addressProp && chainIdProp !== undefined) {
      return { address: addressProp, chainId: chainIdProp }
    }
    // Try to find by symbol in the token list
    const sym = symbol.toLowerCase()
    const match = tokens.find(
      (t) => {
        const ts = t.symbol.toLowerCase()
        return (
          ts === sym ||
          // Unwrap wrapped tokens: wETH→ETH, wBTC→BTC
          (sym.startsWith('w') && ts === sym.slice(1)) ||
          // Unwrap aTokens: aUSDC→USDC (check original casing for 'a' prefix)
          (symbol.startsWith('a') && symbol.length > 1 && symbol[1] === symbol[1].toUpperCase() && ts === sym.slice(1)) ||
          // Unwrap yield vault tokens: yvUSDC→USDC, yvDAI→DAI
          (sym.startsWith('yv') && ts === sym.slice(2)) ||
          // Unwrap staked tokens: stETH→ETH, sDAI→DAI
          (sym.startsWith('st') && ts === sym.slice(2)) ||
          (sym.startsWith('s') && symbol.length > 1 && symbol[1] === symbol[1].toUpperCase() && ts === sym.slice(1))
        )
      }
    )
    return {
      address: addressProp || match?.address,
      chainId: chainIdProp ?? match?.chainId,
    }
  }, [addressProp, chainIdProp, symbol, tokens])

  // Determine the primary image source:
  // 1. Explicit logoUrl prop (from backend)
  // 2. TokensContext logoUrl (from backend via context)
  // 3. Local SVG fallback (only for real, file-safe symbols)
  const imageSource = useMemo(() => {
    if (logoUrl) return logoUrl

    // Try to get logoUrl from context (supports symbol or address lookup)
    const contextLogoUrl = getTokenIcon(symbol)
    if (contextLogoUrl && !contextLogoUrl.startsWith('/icons/')) {
      return contextLogoUrl
    }

    // Local-SVG path: skip if `symbol` is a truncated address (`0x6e54…`),
    // a non-symbol filler (`AERO-LP`, raw address), or contains characters
    // we never ship as a file name. Otherwise the `<img>` requests
    // `/icons/0x6e54%E2%80%A6.svg` and similar — all of which 404 and burn
    // a network round-trip per render before the `onError` chain even has
    // a chance to fall back to the address-based CDN.
    if (!symbol) return fallbackSrc
    if (!isLocalIconSafe(symbol)) return fallbackSrc
    // R2 B5 — a symbol with no file in `public/icons` but a logo shipped
    // elsewhere points at that logo, so the page never requests a 404.
    const alias = LOCAL_ICON_ALIASES[symbol.toLowerCase()]
    if (alias) return alias
    return `/icons/${symbol.toLowerCase()}.svg`
  }, [symbol, logoUrl, getTokenIcon])

  const [imgSrc, setImgSrc] = useState(imageSource)
  const [fallbackLevel, setFallbackLevel] = useState(0)
  // `loaded`/`failed` are tracked separately from the fallback chain so a
  // definitive failure (the generic icon itself 404s) renders a stable
  // letter badge instead of a perpetual skeleton or a broken <img>.
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const reduce = useReducedMotion()

  // Reset when props change
  useEffect(() => {
    setImgSrc(imageSource)
    setFallbackLevel(0)
    setLoaded(false)
    setFailed(false)
  }, [imageSource])

  const handleError = useCallback(() => {
    const hasAddress = address && address.startsWith('0x') && chainId !== undefined

    if (fallbackLevel === 4) {
      // Already on the generic icon (level 5) and it failed too — terminal.
      setFailed(true)
      return
    }

    if (fallbackLevel === 0 && hasAddress) {
      // Level 2: SmolDapp CDN — great DeFi coverage, uses numeric chainId
      setImgSrc(
        `https://assets.smold.app/api/token/${chainId}/${address}/logo-128.png`
      )
      setFallbackLevel(1)
      return
    }
    if (fallbackLevel === 1 && hasAddress) {
      // Level 3: Trust Wallet CDN — deep coverage across 184 chains
      const chainSlug = CHAIN_SLUG[chainId!]
      if (chainSlug) {
        setImgSrc(
          `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainSlug}/assets/${address}/logo.png`
        )
        setFallbackLevel(2)
        return
      }
    }
    if (fallbackLevel <= 2 && hasAddress) {
      // Level 4: CoinGecko / DexScreener via server resolver (cached 24h)
      setImgSrc(`/api/token-icon?chainId=${chainId}&address=${address}`)
      setFallbackLevel(3)
      return
    }
    // Level 5: Generic icon
    setImgSrc(fallbackSrc)
    setFallbackLevel(4)
  }, [fallbackLevel, address, chainId])

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: responsiveSize, height: responsiveSize }}
      data-motion={reduce ? 'off' : 'on'}
    >
      {!loaded && !failed && (
        <Skeleton className="absolute inset-0 rounded-full" />
      )}
      {failed ? (
        <div
          role="img"
          aria-label={`${symbol || 'Unknown'} icon`}
          title={symbol || 'Unknown'}
          className="flex h-full w-full items-center justify-center rounded-full border border-line bg-surface-card text-[9px] font-medium leading-none text-fg-secondary"
        >
          {(symbol || '?').charAt(0).toUpperCase()}
        </div>
      ) : (
        <Image
          src={imgSrc}
          alt={`${symbol || 'Unknown'} icon`}
          width={responsiveSize}
          height={responsiveSize}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`rounded-full transition-opacity duration-150 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } motion-reduce:transition-none`}
          unoptimized
        />
      )}
    </div>
  )
}

export default CryptoIcon
