import { describe, expect, it } from 'vitest'
import {
  getAllSlugs,
  getHeadings,
  getNavTree,
  getPrevNext,
  getPage,
  parseFrontmatter,
} from '@/lib/docs/nav'

describe('lib/docs/nav', () => {
  it('parses frontmatter and strips it from the body', () => {
    const { frontmatter, body } = parseFrontmatter(
      '---\ntitle: Quick start\ndescription: Connect and deploy.\n---\n\n## Body here'
    )
    expect(frontmatter.title).toBe('Quick start')
    expect(frontmatter.description).toBe('Connect and deploy.')
    expect(body).toContain('## Body here')
    expect(body).not.toContain('title:')
  })

  it('builds the ordered nav tree from content/meta.json', () => {
    const tree = getNavTree()
    expect(tree.length).toBeGreaterThan(5)
    expect(tree[0].key).toBe('get-started')
    expect(tree.find((s) => s.key === 'get-started')?.items[0].slug).toBe('get-started/quick-start')
  })

  it('exposes every page slug', () => {
    const slugs = getAllSlugs()
    expect(slugs).toContain('get-started/quick-start')
    expect(slugs).toContain('how-it-works/architecture')
    expect(slugs).toContain('automations/auto-compound')
    expect(slugs).toContain('reference/fees')
    expect(slugs).toContain('faq')
  })

  it('reads a page and its section', () => {
    const page = getPage('get-started/quick-start')
    expect(page?.frontmatter.title).toBe('Quick start')
  })

  it('computes prev/next from the flattened order', () => {
    const { prev, next } = getPrevNext('get-started/quick-start')
    expect(prev).toBeNull()
    expect(next?.slug).toBe('get-started/deploy-account')
  })

  it('extracts h2/h3 headings for the TOC', () => {
    const headings = getHeadings('## A section\n\n### A sub section\n\n## Another')
    expect(headings.map((h) => h.title)).toEqual(['A section', 'A sub section', 'Another'])
    expect(headings[0].level).toBe(2)
    expect(headings[1].level).toBe(3)
    expect(headings[0].id).toBe('a-section')
  })
})