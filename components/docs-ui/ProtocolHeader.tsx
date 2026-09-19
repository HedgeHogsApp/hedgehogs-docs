import DexIcon from '@/components/DexIcon'
import { ChainIcon } from '@/components/docs-ui/ChainIcon'

interface ProtocolHeaderProps {
  protocol: string
  name: string
  chains: string[]
  children: React.ReactNode
}

/** Header block for a protocol page: icon tile + name + chain badges + lede. */
export function ProtocolHeader({ protocol, name, chains, children }: ProtocolHeaderProps) {
  return (
    <div className="my-6 flex items-start gap-4 rounded-lg border border-line bg-surface-panel p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-card ring-1 ring-brand/20">
        <DexIcon protocol={protocol} size={26} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-fg-primary">{name}</h2>
          {chains.map((chain) => (
            <span
              key={chain}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-2 py-0.5 text-3xs text-fg-muted"
            >
              <ChainIcon chain={chain} size={14} />
              {chain === 'mainnet' ? 'Ethereum' : chain === 'bsc' ? 'BNB Chain' : chain}
            </span>
          ))}
        </div>
        <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-fg-secondary">{children}</p>
      </div>
    </div>
  )
}

export default ProtocolHeader