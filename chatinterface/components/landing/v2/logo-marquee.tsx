import type { CSSProperties } from "react"

const platforms = [
  "WordPress",
  "Shopify",
  "Webflow",
  "Framer",
  "Wix",
  "Squarespace",
  "Notion",
  "Next.js",
  "React",
  "Vue",
  "Ghost",
  "Bubble",
]

export function LogoMarquee() {
  const row = [...platforms, ...platforms]

  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-5">
        <p className="mb-8 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
          One snippet · every stack you already ship on
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div
            className="flex w-max items-center animate-tc-marquee"
            style={{ "--marquee-duration": "36s" } as CSSProperties}
          >
            {row.map((name, i) => (
              <span key={`${name}-${i}`} className="flex items-center">
                <span className="px-8 text-[15px] font-medium tracking-[-0.01em] text-foreground/50 transition-colors hover:text-foreground sm:px-10">
                  {name}
                </span>
                <span aria-hidden className="h-4 w-px bg-border" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
