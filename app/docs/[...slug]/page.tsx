import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getPage, getHeadings, getPrevNext, getSectionTitle, getAllSlugs } from '@/lib/docs/nav'
import { mdxComponents } from '@/components/docs-ui/mdxComponents'
import { TocRail } from '@/components/docs-ui/TocRail'
import { Breadcrumb } from '@/components/docs-ui/Breadcrumb'
import { PrevNext } from '@/components/docs-ui/PrevNext'
import { Feedback } from '@/components/docs-ui/Feedback'

export const dynamicParams = false

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug: slug.split('/') }))
}

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getPage(slug.join('/'))
  if (!page) return { title: 'Not found' }
  return { title: page.frontmatter.title, description: page.frontmatter.description }
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params
  const pageSlug = slug.join('/')
  const page = getPage(pageSlug)
  if (!page) notFound()

  const headings = getHeadings(page.body)
  const { prev, next } = getPrevNext(pageSlug)
  const section = pageSlug.split('/')[0]

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0 pb-16">
        <Breadcrumb section={section} sectionTitle={getSectionTitle(section)} pageTitle={page.frontmatter.title} />
        <h1 className="mt-4 text-2xl font-semibold text-fg-primary">{page.frontmatter.title}</h1>
        {page.frontmatter.description && (
          <p className="mt-2 max-w-[65ch] text-base text-fg-secondary">{page.frontmatter.description}</p>
        )}
        <div className="mt-6">
          <MDXRemote
            source={page.body}
            components={mdxComponents()}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>
        <PrevNext prev={prev} next={next} />
        <Feedback />
      </article>
      <TocRail headings={headings} />
    </div>
  )
}