'use client'

import React, { createContext, useEffect, useContext } from 'react'

/**
 * DARK-ONLY (owner decision, 2026-07-06): the product ships one locked dark
 * theme. This provider keeps the same context API so the ~dozen consumers of
 * `useDarkMode()` don't churn, but `darkMode` is always true and the setters
 * are inert. The light token values remain defined in globals.css `:root`
 * (they cost nothing and keep the door open), but no UI can reach them —
 * the theme toggles were removed from the sidebar and Settings.
 */

interface IDarkModeContext {
  darkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (mode: boolean) => void
}

export const DarkModeContext = createContext<IDarkModeContext>({
  darkMode: true,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
})

interface DarkModeProviderProps {
  children: React.ReactNode
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    // Force dark unconditionally; clear any stored 'light' preference from
    // the toggle era so nothing downstream can resurrect it.
    document.documentElement.classList.add('dark')
    window.localStorage.setItem('theme', 'dark')
  }, [])

  return (
    <DarkModeContext.Provider
      value={{ darkMode: true, toggleDarkMode: () => {}, setDarkMode: () => {} }}
    >
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}
