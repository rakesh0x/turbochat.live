"use client"

import { ArrowRight, Link2, Palette, Rocket } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { Reveal } from "./reveal"

const steps = [
  {
    number: "01",
    icon: Link2,
    iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    title: "Connect your content",
    description:
      "Drop in your website URL, upload PDFs, or sync your help center. We crawl, chunk, and index everything automatically.",
    visual: ["yourwebsite.com", "docs / help center", "PDFs & files"],
  },
  {
    number: "02",
    icon: Palette,
    iconClass: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
    title: "Make it yours",
    description:
      "Set the logo, colors, assistant name, and response tone. Add guardrails so it only answers from your content.",
    visual: ["Brand colors", "Response tone", "Guardrails"],
  },
  {
    number: "03",
    icon: Rocket,
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    title: "Embed & go live",
    description:
      "Copy a one-line snippet into your site. Your assistant starts answering customers instantly — 24/7, in every timezone.",
    visual: ["One-line embed", "Live in minutes", "Human handoff built-in"],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            How it works
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            From URL to live agent in three steps.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No engineering sprint. No prompt wrangling. If you can paste a link, you can ship a support agent.
          </p>
        </Reveal>

        <div className="relative grid gap-5 md:grid-cols-3">
          {/* connector line */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />

          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.1}>
              <div className="relative flex h-full flex-col rounded-2xl border bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${step.iconClass} shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
                  >
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif text-4xl font-light text-foreground/15">{step.number}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {step.visual.map((v) => (
                    <span
                      key={v}
                      className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <button
            onClick={() => signInWithGoogle()}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Start building free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
