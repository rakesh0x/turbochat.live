"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { signInWithGoogle } from "../../lib/auth"
import { createCheckoutSession } from "../../lib/dodo-payments"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

const plans = [
  {
    name: "Starter",
    description: "Perfect for side projects and small teams",
    price: "$9",
    period: "/month",
    features: ["Up to 3 team members", "5 projects", "Basic analytics", "Community support", "1GB storage"],
    cta: "Get Started",
    highlighted: false,
    productId: null,
  },
  {
    name: "Pro",
    description: "For growing teams that need more power",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100GB storage",
      "Custom integrations",
      "API access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    productId: "pdt_0NaGTaLaCP8TsMwaiw1t7",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "$99",
    period: "/month",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom SLA",
      "On-premise deployment",
      "Unlimited storage",
      "Advanced security",
      "Training & onboarding",
    ],
    cta: "Contact Sales",
    highlighted: false,
    productId: null,
  },
]
export function PricingSection() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user;
  const isLoading = status === "loading";

  const handleCheckout = async (plan: (typeof plans)[0]) => {
    if (isLoading) return

    const currentUser: any = user

    if (plan.name === "Pro" && plan.productId) {
        if (!currentUser?.id || !currentUser?.email) {
          toast.error("Please sign in before starting checkout");
          return;
      }
      try {
        const payload = {
          product_cart: [
            {
              product_id: plan.productId,
              quantity: 1,
            },
          ],
          customer: {
            email: currentUser.email,
            name: currentUser.name || currentUser.email,
          },
          metadata: {
            user_id: currentUser.id,
          },
          return_url: window.location.origin,
        }
        const checkoutUrl = await createCheckoutSession(payload)
        window.location.href = checkoutUrl
      } catch (error) {
        toast.error("Failed to initiate checkout. Please try again.")
      }
      return
    }
    
    if (plan.name === "Enterprise") {
      window.location.href = "mailto:sales@turbochat.ai"
    } else {
      signInWithGoogle(router)
    }
  }



  return (
    <section id="pricing" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-balance text-lg">
            No hidden fees. No surprises. Choose the plan that works for you.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-cyan-50 to-slate-100 border-cyan-200 shadow-[0_14px_40px_rgba(56,189,248,0.2)]"
                  : "bg-slate-900/55 border-slate-700/60 hover:border-slate-500/70"
              }`}
            >
              {/* Plan Header */}
              <div className="mb-6">
                {plan.highlighted ? <span className="mb-3 inline-block rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100">Most Popular</span> : null}
                <h3 className={`font-heading text-xl font-semibold mb-2 ${plan.highlighted ? "text-slate-900" : "text-slate-100"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? "text-slate-600" : "text-slate-400"}`}>{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`font-display text-4xl font-bold ${plan.highlighted ? "text-slate-900" : "text-slate-100"}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? "text-slate-600" : "text-slate-500"}`}>{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-slate-900" : "text-slate-300"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-slate-700" : "text-slate-300"}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCheckout(plan)}
                className={`block w-full py-3 px-6 text-center rounded-full font-medium text-sm transition-colors mt-auto ${
                  plan.highlighted ? "bg-slate-900 text-slate-100 hover:bg-slate-800" : "bg-slate-100 text-slate-900 hover:bg-cyan-100"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}