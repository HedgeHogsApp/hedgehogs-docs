/**
 * Marketing-site copy of the app's `utils/format.ts`, trimmed to the ONE
 * formatter the landing's seeded preview needs (`formatUSDValue`), with the
 * ethers import dropped so the marketing repo stays free of the app's web3
 * dependency tree. Byte-for-byte identical output to the app's version.
 */

/**
 * Format a USD value with $ symbol and K/M/B/T suffixes.
 *
 * `undefined`/`null`/`NaN` answer `$0.00` — the right default for a
 * measured zero. (The marketing preview only ever passes measured numbers.)
 */
export const formatUSDValue = (value: number): string => {
  if (value === undefined || value === null || isNaN(value)) return '$0.00'

  // For small values, show exact amount with 2 decimal places
  if (value < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}