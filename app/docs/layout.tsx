import { DocsShell } from '@/components/docs-ui/DocsShell'
import { getNavTree } from '@/lib/docs/nav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell sections={getNavTree()}>{children}</DocsShell>
}