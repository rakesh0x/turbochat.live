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
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Works with every site you already use
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div
            className="flex w-max items-center animate-tc-marquee"
            style={{ "--marquee-duration": "36s" } as CSSProperties}
          >
            {row.map((name, i) => (
              <span key={`${name}-${i}`} className="flex items-center">
                <span className="px-8 text-lg font-semibold tracking-tight text-foreground/45 transition-colors hover:text-foreground/80 sm:px-10">
                  {name}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
