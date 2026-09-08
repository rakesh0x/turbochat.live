"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { Reveal } from "./reveal"
import { SectionHeading } from "./panel"

const plans = [
  {
    name: "Free",
    tagline: "For testing the waters",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "1 chatbot",
      "50 messages / month",
      "Website + PDF training",
      "Basic branding",
      "Community support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    tagline: "For growing support teams",
    monthly: 29,
    yearly: 23,
    cta: "Start 7-day trial",
    features: [
      "10 chatbots",
      "5,000 messages / month",
      "All data sources (Notion, sitemap, API)",
      "Advanced branding & custom domain",
      "Analytics & chat logs",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    tagline: "For scale, controls & security",
    monthly: 99,
    yearly: 79,
    cta: "Talk to sales",
    features: [
      "Unlimited chatbots",
      "Custom message volume",
      "SSO & team roles",
      "Dedicated onboarding",
      "SLA & security review",
      "Custom integrations",
    ],
    highlighted: false,
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(true)

  return (
    <section id="pricing" className="scroll-mt-24 border-y bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          className="mb-10"
          eyebrow="Pricing"
          title="Simple plans that scale with you."
          lead="Start free, prove the value, upgrade as chat volume grows. Priced on usage, never per seat."
        />

        {/* billing toggle */}
        <Reveal className="mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
            onClick={() => setYearly((v) => !v)}
            className="relative h-7 w-[52px] cursor-pointer rounded-full bg-foreground/15 transition-colors"
          >
            <span
              className="absolute top-1 block h-5 w-5 rounded-full bg-foreground shadow transition-transform duration-200"
              style={{ transform: yearly ? "translateX(28px)" : "translateX(4px)" }}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
          <span className="rounded-full bg-foreground/8 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-foreground/70">
            save 20%
          </span>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const price = yearly ? plan.yearly : plan.monthly
            return (
              <Reveal key={plan.name} delay={i * 0.08}>
                <div
                  className={`tc-raise relative flex h-full flex-col rounded-3xl border bg-card p-7 transition-colors duration-300 ${
                    plan.highlighted
                      ? "border-foreground/25 ring-1 ring-foreground/10"
                      : "border-border/70 hover:border-foreground/20"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
                      most popular
                    </span>
                  ) : null}

                  <div className="mb-6">
                    <h3 className="font-display font-medium text-2xl">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-medium tracking-tight">${price}</span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                  {yearly && price > 0 ? (
                    <p className="-mt-4 mb-6 text-xs text-muted-foreground">billed annually (${price * 12}/yr)</p>
                  ) : (
                    <p className="-mt-4 mb-6 text-xs text-muted-foreground">
                      {price === 0 ? "free forever, no card" : "billed monthly"}
                    </p>
                  )}

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={`mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full ${
                            plan.highlighted ? "bg-foreground text-background" : "bg-foreground/10 text-foreground/70"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.name === "Enterprise" ? (
                    <a
                      href="mailto:sales@turbochat.live"
                      className={`group inline-flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? "bg-violet-600 text-white hover:bg-violet-500"
                          : "border border-border/70 bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => signInWithGoogle()}
                      className={`group inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? "bg-violet-600 text-white hover:bg-violet-500"
                          : "border border-border/70 bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include source-grounded answers, unlimited languages, and a 99.9% uptime SLA.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
