"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";

const STARTER_PLAN_PRODUCT_ID = "pdt_0NauJou4mqDCcPVwp4kfS";
const PRO_PLAN_PRODUCT_ID = "pdt_0NaGTaLaCP8TsMwaiw1t7";
const ENTERPRISE_PLAN_PRODUCT_ID = "pdt_0NauLa7pvwInvZjndZt6y";

const plans = [
  {
    name: "Starter",
    price: "$9",
    subtitle: "For early projects",
    productId: STARTER_PLAN_PRODUCT_ID,
    features: ["5 projects", "1 GB storage", "Email support"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    subtitle: "Built for active teams",
    productId: PRO_PLAN_PRODUCT_ID,
    features: ["Unlimited projects", "100 GB storage", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    subtitle: "For scale and advanced controls",
    productId: ENTERPRISE_PLAN_PRODUCT_ID,
    features: ["SSO + team controls", "Dedicated onboarding", "Priority technical support"],
    highlighted: false,
  },
];

export default function DashboardPricingModalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const sessionUserId = (session?.user as any)?.id as string | undefined;

  const customerName = useMemo(() => {
    const name = session?.user?.name?.trim();
    return name && name.length > 0 ? name : session?.user?.email || "Turbochat User";
  }, [session?.user?.email, session?.user?.name]);

  const closeModal = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  };

  const handleCheckout = async (productId: string, planName: string) => {
    setError("");

    if (!session?.user?.email || !sessionUserId) {
      setError("Please sign in again before checkout.");
      return;
    }

    setLoadingPlan(planName);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          customer: {
            email: session.user.email,
            name: customerName,
          },
          metadata: {
            source: "dashboard-pricing-modal",
            user_id: sessionUserId,
          },
          return_url: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.message || "Failed to start checkout");
      }

      window.location.href = data.checkout_url;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "Checkout failed. Please try again.";
      setError(message);
      setLoadingPlan(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-label="Pricing"
    >
      <div
        className="relative h-[82vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#070a12] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          className="sticky right-4 top-4 z-10 ml-auto mr-4 mt-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-100 transition hover:bg-zinc-800"
          aria-label="Close pricing"
        >
          <X className="h-5 w-5" />
        </button>

        <main className="px-4 pb-6 sm:px-6">
          <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-slate-900/50 to-zinc-950 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">Turbochat AI Billing</p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">Upgrade credits, stay in flow</h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  Compact plans for dashboard users. Pick one and continue building without leaving your workspace.
                </p>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                Credits activate right after successful payment
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-xl border p-4 ${
                    plan.highlighted
                      ? "border-cyan-300/70 bg-cyan-50 text-slate-900"
                      : "border-zinc-800 bg-zinc-900/70 text-zinc-100"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  ) : null}

                  <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
                  <p className={`text-xs ${plan.highlighted ? "text-slate-700" : "text-zinc-400"}`}>{plan.subtitle}</p>

                  <p className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold leading-none">{plan.price}</span>
                    <span className={`text-xs ${plan.highlighted ? "text-slate-700" : "text-zinc-400"}`}>/month</span>
                  </p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className={`h-4 w-4 ${plan.highlighted ? "text-slate-900" : "text-cyan-300"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.productId, plan.name)}
                    disabled={loadingPlan !== null}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      plan.highlighted
                        ? "bg-slate-900 text-cyan-100 hover:bg-black"
                        : "bg-cyan-600 text-white hover:bg-cyan-500"
                    }`}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting checkout...
                      </>
                    ) : (
                      <>
                        Choose {plan.name}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>

            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          </section>
        </main>
      </div>
    </div>
  );
}
