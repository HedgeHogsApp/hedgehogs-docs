import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'

function setReducedMotion(on: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: on,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lib/diagram/useDiagramLoop', () => {
  it('snaps to the complete frame (t = 1) under reduced motion', () => {
    setReducedMotion(true)
    const { result } = renderHook(() => useDiagramLoop())
    expect(result.current.t.get()).toBe(1)
    expect(result.current.reduce).toBe(true)
  })

  it('starts at t = 0 when motion is allowed', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => useDiagramLoop())
    expect(result.current.t.get()).toBe(0)
    expect(result.current.reduce).toBe(false)
  })

  it('exposes a scope ref for the shell', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => useDiagramLoop())
    expect(result.current.scope.current).toBeNull()
  })
})