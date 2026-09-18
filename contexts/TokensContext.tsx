import { createContext, useContext } from 'react'

/**
 * Minimal, dependency-free stand-in for the app's `TokensContext`.
 *
 * The marketing site renders the seeded Overview preview, whose token icons
 * (`CryptoIcon`) call `useTokens()`. The real app context wires tokens to the
 * backend API; the marketing site never mounts a provider and never fetches
 * tokens — the preview renders with empty tokens and the local-icon fallback,
 * exactly as the app's landing did under its provider-free LightContent shell.
 * Keeping a stub here (instead of copying the app's context + its api-health /
 * chains / token-type closures) keeps the marketing repo decoupled from the
 * app's data layer.
 */
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  chainId: number
  price: number
  logoURI?: string
}

interface TokensContextType {
  tokens: Token[]
  getTokenIcon: (symbolOrAddress: string, chainId?: number) => string
}

const defaultContextValue: TokensContextType = {
  tokens: [],
  getTokenIcon: (symbol: string) => `/icons/${symbol.toLowerCase()}.svg`,
}

const TokensContext = createContext<TokensContextType>(defaultContextValue)

export const useTokens = () => useContext(TokensContext)

export const TokensProvider = ({ children }: { children: React.ReactNode }) => (
  <TokensContext.Provider value={defaultContextValue}>{children}</TokensContext.Provider>
)