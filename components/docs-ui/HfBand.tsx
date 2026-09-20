'use client'

/**
 * HfBand — the health-factor scale as a static band.
 * Danger < 1.0 · Caution 1.0–1.5 · Safe > 1.5. Status colours only (a health
 * factor is status). Always renders the complete frame — no animation.
 */
export function HfBand() {
  return (
    <div className="my-6 rounded-lg border border-line bg-surface-panel p-4">
      <div className="mb-2 flex items-center justify-between text-3xs uppercase tracking-wider text-fg-muted">
        <span>Health factor</span>
        <span className="normal-case tracking-normal">liquidation &lt; 1.0</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full">
        <div className="flex h-full">
          <div className="h-full bg-danger/70" style={{ width: '25%' }} />
          <div className="h-full bg-warning/70" style={{ width: '12.5%' }} />
          <div className="h-full bg-success/70" style={{ width: '62.5%' }} />
        </div>
        <div className="absolute inset-y-0 left-[25%] w-px bg-surface-page" />
        <div className="absolute inset-y-0 left-[37.5%] w-px bg-surface-page" />
      </div>
      <div className="mt-2 flex justify-between text-2xs text-fg-muted">
        <span>0</span>
        <span className="text-danger-fg">1.0</span>
        <span className="text-warning">1.5</span>
        <span className="text-success">2+</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-2xs">
        <div className="rounded-md border border-danger/30 bg-danger/5 p-2">
          <p className="font-semibold text-danger-fg">Near liquidation</p>
          <p className="text-fg-muted">below 1.0</p>
        </div>
        <div className="rounded-md border border-warning/30 bg-warning/5 p-2">
          <p className="font-semibold text-warning">Caution</p>
          <p className="text-fg-muted">1.0 – 1.5</p>
        </div>
        <div className="rounded-md border border-success/30 bg-success/5 p-2">
          <p className="font-semibold text-success">Safe</p>
          <p className="text-fg-muted">above 1.5</p>
        </div>
      </div>
    </div>
  )
}

export default HfBand