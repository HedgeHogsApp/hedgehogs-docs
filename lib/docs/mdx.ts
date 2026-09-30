import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

// Content is first-party (repo files) and passes arrays/JSX as props, so JS
// expressions stay enabled; blockDangerousJS (eval, Function, process…) stays on.
export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
  blockJS: false,
  blockDangerousJS: true,
}
