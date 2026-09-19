import { Callout } from '@/components/docs-ui/Callout'
import { Steps } from '@/components/docs-ui/Steps'
import { GuideCard } from '@/components/docs-ui/GuideCard'
import { CodeBlock } from '@/components/docs-ui/CodeBlock'
import { ArchitectureDiagram } from '@/components/landing/ArchitectureDiagram'
import { ApprovalsDiagram } from '@/components/landing/ApprovalsDiagram'
import StrategyFlowAnimation from '@/components/docs/StrategyFlowAnimation'
import AutoCompoundAnimation from '@/components/docs/AutoCompoundAnimation'
import AutoRepayAnimation from '@/components/docs/AutoRepayAnimation'
import AutoCollaterizeAnimation from '@/components/docs/AutoCollaterizeAnimation'
import AutoHarvestAnimation from '@/components/docs/AutoHarvestAnimation'
import AutoRebalanceAnimation from '@/components/docs/AutoRebalanceAnimation'
import DexIcon from '@/components/DexIcon'
import CryptoIcon from '@/components/CryptoIcon'
import { ChainIcon } from '@/components/docs-ui/ChainIcon'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

function childText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(childText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return childText((node as { props: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

function Heading({ level, children }: { level: 2 | 3 | 4; children?: React.ReactNode }) {
  const id = slugify(childText(children))
  const cls =
    level === 2
      ? 'mt-10 mb-3 text-xl font-semibold text-fg-primary'
      : level === 3
        ? 'mt-8 mb-2 text-base font-semibold text-fg-primary'
        : 'mt-6 mb-2 text-sm font-semibold text-fg-primary'
  const Tag = `h${level}` as 'h2'
  return (
    <Tag id={id} className={`scroll-mt-24 ${cls}`}>
      {children}
    </Tag>
  )
}

export function mdxComponents() {
  return {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="mt-2 mb-3 text-2xl font-semibold text-fg-primary">{props.children}</h1>
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <Heading level={2}>{props.children}</Heading>
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <Heading level={3}>{props.children}</Heading>
    ),
    h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <Heading level={4}>{props.children}</Heading>
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="my-4 max-w-[65ch] text-sm leading-relaxed text-fg-secondary">{props.children}</p>
    ),
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={props.href}
        className="font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors duration-fast hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-motion="on"
      >
        {props.children}
      </a>
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="my-4 flex max-w-[65ch] flex-col gap-2 pl-5 text-sm text-fg-secondary marker:text-fg-muted [&>li]:list-disc">
        {props.children}
      </ul>
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="my-4 flex max-w-[65ch] flex-col gap-2 pl-5 text-sm text-fg-secondary marker:text-fg-muted [&>li]:list-decimal">
        {props.children}
      </ol>
    ),
    li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed">{props.children}</li>,
    strong: (props: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-semibold text-fg-primary">{props.children}</strong>
    ),
    code: (props: React.HTMLAttributes<HTMLElement>) => (
      <code className="rounded bg-surface-panel px-1.5 py-0.5 font-mono text-[0.85em] text-fg-primary">
        {props.children}
      </code>
    ),
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
      <CodeBlock>{props.children}</CodeBlock>
    ),
    table: (props: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="scrollbar-thin my-5 overflow-x-auto rounded-lg border border-line bg-surface-panel">
        <table className="w-full border-collapse text-2xs">{props.children}</table>
      </div>
    ),
    thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="sticky top-0 z-sticky bg-surface-panel">{props.children}</thead>
    ),
    th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th className="border-b border-line px-3 py-2.5 text-left font-semibold text-fg-primary">
        {props.children}
      </th>
    ),
    td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="border-b border-line/70 px-3 py-2.5 align-top text-fg-secondary last:border-0 [&:has(.font-mono)]:tabular-nums">
        {props.children}
      </td>
    ),
    hr: () => <hr className="my-8 border-line" />,
    blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="my-5 border-l-2 border-brand/40 pl-4 text-sm italic text-fg-muted">
        {props.children}
      </blockquote>
    ),
    Callout,
    Steps,
    GuideCard,
    ArchitectureDiagram,
    ApprovalsDiagram,
    StrategyFlowAnimation,
    AutoCompoundAnimation,
    AutoRepayAnimation,
    AutoCollaterizeAnimation,
    AutoHarvestAnimation,
    AutoRebalanceAnimation,
    DexIcon,
    CryptoIcon,
    ChainIcon,
  }
}