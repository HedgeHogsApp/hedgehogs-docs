import fs from 'node:fs'
import path from 'node:path'

export interface NavItem {
  slug: string
  title: string
  description: string
  section: string
}

export interface NavSection {
  key: string
  title: string
  items: NavItem[]
}

export interface PageFrontmatter {
  title: string
  description: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** Parse YAML-ish frontmatter (title/description) + return the body. */
export function parseFrontmatter(source: string): {
  frontmatter: PageFrontmatter
  body: string
} {
  const fm: Partial<PageFrontmatter> = {}
  const body = source.replace(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/, (_m, raw: string) => {
    for (const line of raw.split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/)
      if (m) fm[m[1] as keyof PageFrontmatter] = m[2].trim()
    }
    return ''
  })
  return {
    frontmatter: {
      title: fm.title ?? 'Untitled',
      description: fm.description ?? '',
    },
    body,
  }
}

/** The ordered nav tree, derived from content/meta.json + per-section meta.json. */
export function getNavTree(): NavSection[] {
  const root = readJson(path.join(CONTENT_DIR, 'meta.json')) as { order: string[] }
  const sections: NavSection[] = []
  for (const key of root.order) {
    const dir = path.join(CONTENT_DIR, key)
    if (!fs.existsSync(dir)) continue
    const meta = fs.existsSync(path.join(dir, 'meta.json'))
      ? (readJson(path.join(dir, 'meta.json')) as { title: string; order: string[] })
      : { title: key, order: [] }
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''))
    const ordered = [...meta.order, ...files.filter((f) => !meta.order.includes(f))]
    const items: NavItem[] = []
    for (const slug of ordered) {
      const file = path.join(dir, `${slug}.mdx`)
      if (!fs.existsSync(file)) continue
      const source = fs.readFileSync(file, 'utf8')
      const { frontmatter } = parseFrontmatter(source)
      const pageSlug = slug === 'index' ? key : `${key}/${slug}`
      items.push({ slug: pageSlug, title: frontmatter.title, description: frontmatter.description, section: key })
    }
    sections.push({ key, title: meta.title, items })
  }
  return sections
}

/** Flat list of every page slug. */
export function getAllSlugs(): string[] {
  return getNavTree().flatMap((s) => s.items.map((i) => i.slug))
}

export function getSectionTitle(section: string): string {
  const tree = getNavTree()
  return tree.find((s) => s.key === section)?.title ?? section
}

export function getPage(slug: string): { frontmatter: PageFrontmatter; body: string } | null {
  const parts = slug.split('/')
  const file =
    parts.length === 1
      ? path.join(CONTENT_DIR, parts[0], 'index.mdx')
      : path.join(CONTENT_DIR, parts[0], `${parts[1]}.mdx`)
  if (!fs.existsSync(file)) return null
  const source = fs.readFileSync(file, 'utf8')
  return parseFrontmatter(source)
}

/** Previous + next in the flattened nav order. */
export function getPrevNext(slug: string): { prev: NavItem | null; next: NavItem | null } {
  const flat = getNavTree().flatMap((s) => s.items)
  const i = flat.findIndex((n) => n.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return { prev: flat[i - 1] ?? null, next: flat[i + 1] ?? null }
}

/** Extract h2/h3 headings from MDX body for the TOC rail. */
export function getHeadings(body: string): { id: string; title: string; level: number }[] {
  const out: { id: string; title: string; level: number }[] = []
  const re = /^##{1,2}\s+(.+)$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const level = m[0].startsWith('###') ? 3 : 2
    const title = m[1].replace(/[`*]/g, '').trim()
    if (!title) continue
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    out.push({ id, title, level })
  }
  return out
}

/** A build-time JSON index for the search (title, description, url). */
export function buildSearchIndex(): { title: string; description: string; url: string }[] {
  return getNavTree().flatMap((s) =>
    s.items.map((i) => ({ title: i.title, description: i.description, url: `/docs/${i.slug}` }))
  )
}