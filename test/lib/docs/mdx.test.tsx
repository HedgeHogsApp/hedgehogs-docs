import { describe, expect, it } from 'vitest'
import { compileMDX } from 'next-mdx-remote/rsc'
import { renderToStaticMarkup } from 'react-dom/server'
import { mdxOptions } from '@/lib/docs/mdx'

// Content relies on JS-expression props (`chains={['mainnet']}`, `steps={[...]}`),
// which next-mdx-remote v6 strips by default.
function Chains({ chains }: { chains?: string[] }) {
  return <span>{chains ? chains.join(',') : 'MISSING'}</span>
}

describe('mdxOptions', () => {
  it('keeps JS-expression props on components', async () => {
    const { content } = await compileMDX({
      source: "<Chains chains={['mainnet', 'base']} />",
      components: { Chains },
      options: mdxOptions,
    })
    expect(renderToStaticMarkup(content)).toContain('mainnet,base')
  })

  it('still blocks dangerous expressions', async () => {
    await expect(
      compileMDX({
        source: '<Chains chains={[eval("1")]} />',
        components: { Chains },
        options: mdxOptions,
      }),
    ).rejects.toThrow()
  })

  it('renders GFM tables', async () => {
    const { content } = await compileMDX({
      source: '| a | b |\n| - | - |\n| 1 | 2 |',
      options: mdxOptions,
    })
    expect(renderToStaticMarkup(content)).toContain('<table>')
  })
})
