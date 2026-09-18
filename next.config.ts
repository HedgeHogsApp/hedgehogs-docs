import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const cspPolicy = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self'" +
    (isDev ? " http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*" : ''),
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: cspPolicy },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      { pathname: '/dexes/**' },
      { pathname: '/chains/**' },
      { pathname: '/icons/**' },
      { pathname: '/wallets/**' },
      { pathname: '/lendingprotocols/**' },
      { pathname: '/landing/**' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig