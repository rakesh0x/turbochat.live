"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import posthog from "posthog-js"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

/* ---------------------------------------------------------------------------
   Plans — one source of truth for both pricing surfaces.

   `/pricing` renders these as a page and the dashboard renders the paid ones
   as an upgrade sheet (app/dashboard/@modal/(..)pricing/page.tsx), so price,
   credits and the Dodo product a plan checks out against all live here. No
   fact about a plan is typed twice.

   `credits` mirrors the plan -> credit mapping the payment webhook applies in
   app/api/webhooks/dodo/route.ts (starter 10, pro 50, enterprise 200). These
   are the numbers a customer reads before paying, so they move together with
   that mapping or the pricing lies.
   --------------------------------------------------------------------------- */

// Real Dodo products. Editing an id changes what a customer is billed for.
const STARTER_PRODUCT_ID = "pdt_0NauJou4mqDCcPVwp4kfS"
const PRO_PRODUCT_ID = "pdt_0NaGTaLaCP8TsMwaiw1t7"
const ENTERPRISE_PRODUCT_ID = "pdt_0NauLa7pvwInvZjndZt6y"

export type PlanCheckout = {
  productId: string
  /** Set only where checkout really asks Dodo for a trial. */
  trialDays?: number
}

export type PricingPlan = {
  name: string
  blurb: string
  price: string
  period: string
  /** Credits a payment grants. `null` means this plan grants none. */
  credits: number | null
  features: readonly string[]
  /** Button label on the marketing surface. */
  cta: string
  /** Emphasised with ink, never with the marker. One plan at most. */
  featured: boolean
  checkout: PlanCheckout | null
}

export type CheckoutPlan = PricingPlan & { checkout: PlanCheckout }

export const PLANS: readonly PricingPlan[] = [
  {
    name: "Free",
    blurb: "For trying it on a real site",
    price: "$0",
    period: "/month",
    credits: null,
    features: [
      "A free trial to create your first chatbot",
      "Reads the pages you choose",
      "Every answer names the page it came from",
      "Basic appearance controls",
    ],
    cta: "Start free",
    featured: false,
    checkout: null,
  },
  {
    name: "Starter",
    blurb: "For a first site",
    price: "$9",
    period: "/month",
    credits: 10,
    features: [
      "7-day free trial, then $9 a month",
      "Reads the pages you choose",
      "Email support",
    ],
    cta: "Start 7-day trial",
    featured: false,
    checkout: { productId: STARTER_PRODUCT_ID, trialDays: 7 },
  },
  {
    name: "Pro",
    blurb: "For a growing support team",
    price: "$29",
    period: "/month",
    credits: 50,
    features: [
      "Everything in Starter",
      "Priority responses",
      "Full appearance controls",
    ],
    cta: "Sign in to get Pro",
    featured: true,
    checkout: { productId: PRO_PRODUCT_ID },
  },
  {
    name: "Enterprise",
    blurb: "For scale, controls, and security reviews",
    price: "$99",
    period: "/month",
    credits: 200,
    features: [
      "Everything in Pro",
      "Single sign-on and team controls",
      "Guided onboarding",
      "Uptime commitments",
    ],
    cta: "Talk to sales",
    featured: false,
    checkout: { productId: ENTERPRISE_PRODUCT_ID },
  },
]

/** The plans the dashboard sheet can send to checkout. Free has no product. */
export const CHECKOUT_PLANS: readonly CheckoutPlan[] = PLANS.filter(
  (plan): plan is CheckoutPlan => plan.checkout !== null,
)

/** What a credit is, said once and reused on both surfaces. */
export const CREDITS_NOTE =
  "Credits are added when your payment goes through, and you spend them to create chatbots."

const PLAN_LADDER = ["Free", "Pro", "Enterprise"]

export function PlanCard({
  plan,
  scale = "page",
  action,
}: {
  plan: PricingPlan
  /** `page` uses the marketing type scale, `sheet` the dashboard's density. */
  scale?: "page" | "sheet"
  action: ReactNode
}) {
  const { featured } = plan
  const sheet = scale === "sheet"
  const quiet = featured ? "text-primary-foreground/75" : "text-muted-foreground"

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border",
        sheet ? "p-5" : "p-6",
        featured
          ? "border-primary bg-primary text-primary-foreground shadow-raised"
          : sheet
            ? "border-border bg-surface-2 text-foreground"
            : "border-border bg-card text-card-foreground shadow-card",
      )}
    >
      {/* Ink carries the recommendation. The marker means "this is the passage
          the answer came from" and nothing else, so it never appears here.
          The label keeps the emphasis readable without relying on colour. */}
      {featured ? (
        <p className="mb-4 inline-flex w-fit items-center rounded-full border border-primary-foreground/25 px-2.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
          Recommended
        </p>
      ) : null}

      <h3 className={cn("font-display font-medium tracking-[-0.02em]", sheet ? "text-lg" : "text-2xl")}>
        {plan.name}
      </h3>
      <p className={cn("mt-1 text-sm", quiet)}>{plan.blurb}</p>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span
          className={cn(
            "tc-num font-mono font-medium leading-none",
            sheet ? "text-3xl" : "text-4xl",
          )}
        >
          {plan.price}
        </span>
        <span className={cn("text-sm", quiet)}>{plan.period}</span>
      </p>

      {/* The one quantity that actually differs between plans, on a ruled row
          so it lines up across cards and can be compared at a glance. */}
      <dl
        className={cn(
          "mt-5 flex items-center justify-between gap-3 border-t pt-3",
          featured ? "border-primary-foreground/20" : "border-border",
        )}
      >
        <dt
          className={
            featured
              ? "font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-primary-foreground/75"
              : "tc-eyebrow"
          }
        >
          Credits
        </dt>
        <dd className="tc-num font-mono text-sm">
          {plan.credits === null ? "Free trial" : plan.credits}
        </dd>
      </dl>

      <ul className={cn("flex-1 space-y-2.5", sheet ? "mt-4" : "mt-5")}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                featured ? "text-primary-foreground/75" : "text-signal",
              )}
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={sheet ? "mt-5" : "mt-7"}>{action}</div>
    </article>
  )
}

export function PricingCards({ showCompareLink = true }: { showCompareLink?: boolean }) {
  const ladder = PLAN_LADDER.map((name) => PLANS.find((plan) => plan.name === name)).filter(
    (plan): plan is PricingPlan => Boolean(plan),
  )
  const starter = PLANS.find((plan) => plan.name === "Starter")

  return (
    <section id="pricing" className="border-t border-border px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="tc-eyebrow">Pricing</p>
          <h2 className="tc-display tc-display-lg mt-4 text-foreground">
            Start free, upgrade when you need more chatbots
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every plan reads the pages you choose and names the page each answer came
            from. What changes between them is how many chatbots you can create.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {ladder.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              action={
                <Button
                  className="w-full rounded-full"
                  variant={plan.featured ? "secondary" : "outline"}
                  size="lg"
                  asChild
                >
                  {plan.name === "Enterprise" ? (
                    <a
                      href="mailto:sales@turbochat.live"
                      onClick={() =>
                        posthog.capture("pricing_plan_clicked", {
                          plan: plan.name,
                          cta: plan.cta,
                        })
                      }
                    >
                      {plan.cta}
                    </a>
                  ) : (
                    <Link
                      href="/api/auth/signin/google?callbackUrl=%2Fonboarding"
                      onClick={() =>
                        posthog.capture("pricing_plan_clicked", {
                          plan: plan.name,
                          cta: plan.cta,
                        })
                      }
                    >
                      {plan.cta}
                    </Link>
                  )}
                </Button>
              }
            />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl space-y-2 text-center text-sm text-muted-foreground">
          <p>
            {CREDITS_NOTE} Plans are billed monthly and you can cancel any time.
            {showCompareLink ? (
              <>
                {" "}
                <Link href="/pricing" className="text-signal underline underline-offset-4">
                  Compare plans in detail
                </Link>
              </>
            ) : null}
          </p>
          {starter ? (
            <p>
              A{" "}
              <span className="tc-num font-mono text-foreground">{starter.price}</span>{" "}
              Starter plan with{" "}
              <span className="tc-num font-mono text-foreground">{starter.credits}</span>{" "}
              credits is also available in your dashboard once you sign in.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
