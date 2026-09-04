"use client"

import { Quote, Star } from "lucide-react"
import { Reveal } from "./reveal"

const testimonials = [
  {
    quote:
      "TurboChat cut our first-response time from hours to seconds. It resolves about 60% of our tickets before a human ever sees them — and the answers actually cite our docs.",
    name: "Maya Chen",
    role: "Head of Support, Lumen",
    initials: "MC",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    quote:
      "We trained it on our help center in one afternoon. It's the first AI tool our whole team actually trusts, because it refuses to make things up.",
    name: "Daniel Ruiz",
    role: "Founder, Cobalt",
    initials: "DR",
    gradient: "from-sky-500 to-indigo-500",
  },
  {
    quote:
      "Switching from Intercom saved us $1,400 a month, and our customers say the answers are more accurate now. The one-line embed took literally a minute.",
    name: "Priya Nair",
    role: "CX Lead, Driftline",
    initials: "PN",
    gradient: "from-amber-500 to-orange-500",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Loved by support teams
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Teams ship faster when support runs itself.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
                <Quote className="mb-4 h-6 w-6 text-violet-300 dark:text-violet-500/60" />
                <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-bold text-white`}
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
