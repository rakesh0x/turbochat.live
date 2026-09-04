"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { Reveal } from "./reveal"

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
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Pricing
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Simple plans that scale with you.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, prove the value, upgrade as chat volume grows. No per-seat surprises.
          </p>
        </Reveal>

        {/* billing toggle */}
        <Reveal className="mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
            onClick={() => setYearly((v) => !v)}
            className="relative h-7 w-13 rounded-full bg-foreground/15 p-1 transition-colors"
            style={{ width: 52 }}
          >
            <span
              className="block h-5 w-5 rounded-full bg-foreground shadow transition-transform duration-200"
              style={{ transform: yearly ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Save 20%
          </span>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const price = yearly ? plan.yearly : plan.monthly
            return (
              <Reveal key={plan.name} delay={i * 0.08}>
                <div
                  className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 ${
                    plan.highlighted
                      ? "border-violet-500/50 bg-card shadow-[0_30px_80px_-30px_rgba(124,58,237,0.45)]"
                      : "border-border bg-card hover:border-foreground/20"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-1 text-xs font-semibold text-white shadow-lg">
                      Most popular
                    </span>
                  ) : null}

                  <div className="mb-6">
                    <h3 className="font-serif text-2xl">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="font-serif text-5xl font-medium tracking-tight">${price}</span>
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
                          className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${
                            plan.highlighted
                              ? "bg-violet-600 text-white"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
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
                          : "border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => signInWithGoogle()}
                      className={`group inline-flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? "bg-violet-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:bg-violet-500"
                          : "border bg-background text-foreground hover:bg-muted"
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
