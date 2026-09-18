interface StepsProps {
  title?: string
  items: { title: string; children: React.ReactNode }[]
}

/** A numbered how-to list — the in-app `/docs` 5-step pattern, componentized. */
export function Steps({ title, items }: StepsProps) {
  return (
    <div className="my-6">
      {title && <p className="mb-3 text-sm font-semibold text-fg-primary">{title}</p>}
      <ol className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-3xs font-bold text-brand ring-1 ring-brand/30">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg-primary">{item.title}</p>
              <div className="text-sm text-fg-secondary">{item.children}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}