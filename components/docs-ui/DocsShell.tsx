'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DURATION_S, EASE_OUT_QUART } from '@/lib/motion/tokens'
import { Topbar } from '@/components/docs-ui/Topbar'
import { Sidebar } from '@/components/docs-ui/Sidebar'
import type { NavSection } from '@/lib/docs/nav'

interface DocsShellProps {
  sections: NavSection[]
  children: React.ReactNode
}

export function DocsShell({ sections, children }: DocsShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar onMenuClick={() => setDrawerOpen(true)} />
      <div className="flex flex-1">
        <div className="hidden w-64 shrink-0 border-r border-line lg:block">
          <Sidebar sections={sections} />
        </div>
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION_S.fast, ease: EASE_OUT_QUART }}
              className="fixed inset-0 z-drawer bg-black/60"
              onClick={() => setDrawerOpen(false)}
              data-motion="on"
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: DURATION_S.base, ease: EASE_OUT_QUART }}
              className="fixed inset-y-0 left-0 z-drawer w-72 overflow-y-auto bg-surface-page shadow-panel-elevated"
              role="dialog"
              aria-modal="true"
              aria-label="Documentation navigation"
              data-motion="on"
            >
              <Sidebar sections={sections} onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}