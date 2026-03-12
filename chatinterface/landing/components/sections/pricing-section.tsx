"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import Link from "next/link"
import { signInWithGoogle } from "../../lib/auth"
import { createCheckoutSession } from "../../lib/dodo-payments"
import { createClient } from "../../lib/supabase/client"
import { toast } from "sonner"

const plans = [
  {
    name: "Starter",
    description: "Perfect for side projects and small teams",
    price: "$0",
    period: "forever",
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
    price: "Custom",
    period: "",
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
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCheckout = async (plan: (typeof plans)[0]) => {
    if (isLoading) return

    // TEMPORARY BYPASS FOR TESTING
    const mockUser = { email: "test@example.com", user_metadata: { full_name: "Test User" } }
    const currentUser = user || mockUser

    if (plan.name === "Pro" && plan.productId) {
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
            name: currentUser.user_metadata?.full_name || currentUser.email,
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
    
    // For other plans (like Starter or Enterprise), handle accordingly
    if (plan.name === "Starter") {
      window.location.href = "/dashboard"
    } else {
      signInWithGoogle(router)
    }
  }

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-zinc-100 mb-4">Simple, transparent pricing</h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-balance text-lg">
            No hidden fees. No surprises. Choose the plan that works for you.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl border flex flex-col h-full ${
                plan.highlighted ? "bg-zinc-100 border-zinc-100" : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={`font-heading text-xl font-semibold mb-2 ${plan.highlighted ? "text-zinc-900" : "text-zinc-100"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? "text-zinc-600" : "text-zinc-500"}`}>{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`font-display text-4xl font-bold ${plan.highlighted ? "text-zinc-900" : "text-zinc-100"}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? "text-zinc-600" : "text-zinc-500"}`}>{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-zinc-900" : "text-zinc-400"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-zinc-700" : "text-zinc-400"}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCheckout(plan)}
                className={`block w-full py-3 px-6 text-center rounded-full font-medium text-sm transition-colors mt-auto ${
                  plan.highlighted ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
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
