import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardDescription, CardHeader, CardAction, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
function BillingPage({
  userProfile,
  stats,
  chatbotCount,
}: {
  userProfile: any;
  stats: any;
  chatbotCount: number;
}) {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      description: 'Launch with a 7-day free trial, then $9/month',
      price: '$9',
      productId: 'pdt_0NauJou4mqDCcPVwp4kfS',
      features: ['7-day free trial', '2 chatbots included', '15 support chats included', 'Email support'],
      highlighted: false,
    },
    {
      name: 'Pro',
      description: 'For teams that need higher limits and priority support',
      price: '$29',
      productId: 'pdt_0NaGTaLaCP8TsMwaiw1t7',
      features: ['Higher chatbot and chat capacity', 'Faster support response', 'Priority support', 'API access'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      description: 'For organizations that need scale, controls, and onboarding',
      price: '$99',
      productId: 'pdt_0NauLa7pvwInvZjndZt6y',
      features: ['Everything in Pro', 'SSO + team controls', 'Dedicated onboarding', 'SLA options'],
      highlighted: false,
    },
  ];

  const handleCheckout = async (productId: string, planName: string) => {
    if (!session?.user?.email) {
      toast.error('Please sign in before starting checkout.');
      return;
    }

    setLoadingPlan(planName);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          customer: {
            email: session.user.email,
            name: session.user.name || session.user.email,
          },
          metadata: {
            source: 'dashboard-billing-page',
          },
          return_url: `${window.location.origin}/dashboard`,
          ...(planName === 'Starter' ? { trial_period_days: 7 } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.message || 'Unable to start checkout');
      }

      window.location.href = data.checkout_url;
    } catch (error: any) {
      toast.error(error?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const totalMessages = stats?.totalMessages ?? 0;
  const currentPlan = (userProfile?.plan || 'free').toUpperCase();
  const chatbotUsagePercent = Math.min(100, (chatbotCount / 1) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl shadow-slate-400/35 dark:border-slate-800 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 dark:text-slate-900 dark:shadow-none">
        <h2 className="text-2xl font-semibold tracking-tight">Upgrade credits, keep building</h2>
        <p className="mt-2 text-sm text-white/80 dark:text-slate-700">Hosted pages, chatbot creation, and training run better with paid credits.</p>
      </section>

      {/* Usage */}
      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>{currentPlan} Plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages</span>
              <span className="font-medium">{totalMessages} total</span>
            </div>
            <Progress value={Math.min(100, totalMessages > 0 ? 70 : 5)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Chatbots</span>
              <span className="font-medium">{chatbotCount}</span>
            </div>
            <Progress value={chatbotUsagePercent} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted
              ? 'border-cyan-300/70 bg-cyan-50 text-slate-900 shadow-xl ring-1 ring-cyan-200/70 dark:text-slate-900'
              : 'border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none'}
          >
            {plan.highlighted && (
              <div className="px-4 pt-4">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className={`${plan.highlighted ? 'text-slate-700' : 'text-muted-foreground'}`}>/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                onClick={() => handleCheckout(plan.productId, plan.name)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.name ? 'Starting checkout...' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}