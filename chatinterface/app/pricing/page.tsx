"use client"

import { Header } from "@/components/landing/header"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import Link from "next/link"
import posthog from "posthog-js"

const plans = [
  {
    name: "Free",
    subtitle: "Best for testing TurboChat",
    price: "$0",
    period: "/month",
    features: ["1 chatbot", "Website training", "Up to 15 support chats", "Basic customization"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    subtitle: "For growing SaaS support teams",
    price: "$29",
    period: "/month",
    features: ["Up to 10 chatbots", "Priority responses", "Advanced branding", "Higher chat capacity"],
    cta: "Start 7-day trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    subtitle: "For scale, controls, and security",
    price: "$99",
    period: "/month",
    features: ["Everything in Pro", "SSO and team controls", "Dedicated onboarding", "SLA options"],
    cta: "Talk to sales",
    highlighted: false,
  },
]

function PricingSectionInline() {
  return (
    <section id="pricing" className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 text-sm border rounded-full mb-6">Pricing</span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-balance">Simple plans as you scale</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Start free, prove value quickly, then upgrade as chat volume grows. Every plan is designed for faster
            support and better customer experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlighted ? "bg-muted/60 shadow-md border-foreground/20" : "bg-card"
              }`}
            >
              <div className="mb-6">
                {plan.highlighted ? (
                  <span className="inline-block px-3 py-1 text-xs rounded-full bg-foreground text-background mb-4">
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-serif text-2xl mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-semibold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">v</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === "Enterprise" ? (
                <a
                  href="mailto:sales@turbochat.live"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 text-sm text-center"
                  onClick={() => posthog.capture("pricing_plan_clicked", { plan: plan.name, cta: plan.cta })}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href="/api/auth/signin/google?callbackUrl=%2Fdashboard"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 text-sm text-center"
                  onClick={() => posthog.capture("pricing_plan_clicked", { plan: plan.name, cta: plan.cta })}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <PricingSectionInline />
      <CtaSection />
      <Footer />
    </main>
  )
}