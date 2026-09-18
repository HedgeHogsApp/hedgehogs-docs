import { getNavTree } from '@/lib/docs/nav'

/** Agent-readable markdown index of the whole site (llms.txt spec, as Uniswap ships). */
export function GET() {
  const tree = getNavTree()
  const lines: string[] = [
    '# HedgeHogs Documentation',
    '',
    '> LLM-friendly index. Per-page Markdown is served at /docs/<slug>.md.',
    '',
  ]
  for (const section of tree) {
    lines.push(`## ${section.title}`)
    for (const item of section.items) {
      lines.push(`* [${item.title}](/docs/${item.slug}.md): ${item.description}`)
    }
    lines.push('')
  }
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}