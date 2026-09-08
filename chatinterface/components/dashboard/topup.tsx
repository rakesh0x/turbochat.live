'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { ArrowRightOutlined, Bolt2Outlined } from '@lineiconshq/free-icons';
import { useSession } from '@/lib/nextAuthReact';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  CHECKOUT_PLANS,
  CREDITS_NOTE,
  type CheckoutPlan,
} from '@/components/landing/pricing-cards';
import { TopUpContext, type TopUpContextValue } from './topup-context';
import { CreditMeter, type CreditState } from './upsell';

/* ==========================================================================
   Credits — the dialog
   --------------------------------------------------------------------------
   This is not the pricing page in a box, and the difference is the point.

   /pricing sells: a headline, three equal columns, a feature list per column,
   a marketing nav above and a call to action below. It is built for a stranger
   deciding whether this product is worth paying for. The person who reaches
   *this* dialog already pays the product attention — they were adding a
   chatbot and got stopped. Three consequences:

     · Their own number comes first. The meter and "nothing left" are the
       subject; plans are the remedy, so plans come second.

     · One move is recommended, not three compared. The cheapest plan that
       clears the block, priced as what leaves their account *today* — which
       on a trial is nothing. Comparison shopping already has a screen
       (Plan & usage) and it is one click from here.

     · The alternatives are rows, not cards. No feature bullets: someone who
       is blocked will not read four of those, and a row still carries the two
       facts that decide it — credits and price.

   Checkout posts from here and the browser goes straight to Dodo, so the
   console is never left except to pay. `return_url` comes back to Plan &
   usage, where the new credits are the thing on screen.
   ========================================================================== */

/** Posting to checkout. Shared with the plan grid on Plan & usage, so the
    dialog is not the only place that can take money. */
export function useCheckout(source: string) {
  const { data: session } = useSession();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');

  const start = useCallback(
    async (plan: CheckoutPlan) => {
      setError('');

      const email = session?.user?.email;
      const userId = (session?.user as any)?.id as string | undefined;

      /* Dodo bills a customer, so a checkout with no identity is one nobody
         can be credited for. Say that here rather than fail at the gateway. */
      if (!email || !userId) {
        setError('Your session expired. Sign in again and this will work.');
        return;
      }

      setPending(plan.name);

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_cart: [{ product_id: plan.checkout.productId, quantity: 1 }],
            customer: { email, name: session?.user?.name?.trim() || email },
            metadata: { source, plan: plan.name },
            return_url: `${window.location.origin}/dashboard?p=billing`,
            ...(plan.checkout.trialDays ? { trial_period_days: plan.checkout.trialDays } : {}),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data?.checkout_url) {
          throw new Error(data?.message || 'Checkout could not be started.');
        }

        window.location.href = data.checkout_url;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Checkout could not be started.');
        setPending(null);
      }
    },
    [session, source],
  );

  return { start, pending, error };
}

/* The step up from wherever they are. On the top plan there is no step, so the
   recommendation becomes another instance of it — 200 more credits — because
   "nothing to sell you" is not an answer to "I am blocked". */
function nextUp(plan: string): CheckoutPlan {
  const here = CHECKOUT_PLANS.findIndex(
    (entry) => entry.name.toLowerCase() === plan.trim().toLowerCase(),
  );
  return CHECKOUT_PLANS[Math.min(here + 1, CHECKOUT_PLANS.length - 1)] ?? CHECKOUT_PLANS[0];
}

function chatbotsFrom(credits: number | null): string {
  if (credits === null) return 'more chatbots';
  return credits === 1 ? '1 more chatbot' : `${credits} more chatbots`;
}

function TopUpDialog({
  open,
  onOpenChange,
  state,
  reason,
  onViewPlans,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  state: CreditState;
  /** Which ask opened this, for checkout metadata. */
  reason?: string;
  onViewPlans?: () => void;
}) {
  const { start, pending, error } = useCheckout(
    reason ? `dashboard-topup:${reason}` : 'dashboard-topup',
  );

  const recommended = useMemo(() => nextUp(state.plan), [state.plan]);
  const others = useMemo(
    () => CHECKOUT_PLANS.filter((plan) => plan.name !== recommended.name),
    [recommended.name],
  );

  const empty = state.level === 'empty';
  const trialDays = recommended.checkout.trialDays ?? 0;
  const busy = pending !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[30rem]">
        {/* What is true right now. Their number, before any price. */}
        <div className="border-b border-border px-6 pb-5 pt-6">
          <p className="tc-eyebrow">/credits</p>
          {/* font-medium and the explicit leading are not decoration: DialogTitle
              ships `font-semibold leading-none` as utilities, which outrank the
              tc-display component layer and would print the display face at the
              wrong weight. */}
          <DialogTitle className="tc-display mt-2 text-[1.5rem] font-medium leading-[1.14]">
            {empty ? 'You are out of credits' : 'Running low on credits'}
          </DialogTitle>
          <DialogDescription className="mt-2 tc-body">
            {empty
              ? 'Every chatbot you have already published keeps answering. Adding the next one costs one credit.'
              : `${state.credits ?? 0} left, and each new chatbot costs one. Topping up now keeps the next one from waiting.`}
          </DialogDescription>
          <CreditMeter state={state} className="mt-5" />
        </div>

        <div className="px-6 py-5">
          {/* The one move. Priced as what actually leaves the account today,
              because that is the number that decides whether they click. */}
          <div className="rounded-xl border border-border-strong bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="tc-eyebrow text-signal">Clears this now</p>
                <p className="mt-1.5 tc-heading text-foreground">
                  {recommended.name}
                </p>
                <p className="tc-path mt-0.5 text-muted-foreground">
                  {recommended.credits} credits · {chatbotsFrom(recommended.credits)}
                </p>
              </div>
              <p className="tc-num shrink-0 font-mono text-xl text-foreground">
                {trialDays ? '$0' : recommended.price}
                <span className="tc-meta text-muted-foreground">
                  {trialDays ? ' today' : recommended.period}
                </span>
              </p>
            </div>

            <Button
              variant="plate"
              className="mt-4 w-full"
              onClick={() => start(recommended)}
              disabled={busy}
            >
              {pending === recommended.name ? (
                'Opening checkout…'
              ) : (
                <>
                  <Lineicons icon={Bolt2Outlined as any} size={15} aria-hidden="true" />
                  {trialDays ? `Start the ${trialDays}-day trial` : `Get ${recommended.name}`}
                </>
              )}
            </Button>

            {trialDays ? (
              <p className="tc-path mt-2 text-center text-muted-foreground">
                {trialDays}-day trial, then {recommended.price}
                {recommended.period}.
              </p>
            ) : null}
          </div>

          {/* Rows, not cards. Two facts each, and the same button. */}
          <p className="tc-eyebrow mt-5">More at once</p>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {others.map((plan) => (
              <li key={plan.name} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block tc-label text-foreground">
                    {plan.name}
                  </span>
                  <span className="tc-path block text-muted-foreground">
                    {plan.credits} credits
                  </span>
                </span>
                <span className="tc-num shrink-0 tc-path text-foreground">
                  {plan.price}
                  <span className="text-muted-foreground">{plan.period}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => start(plan)}
                  disabled={busy}
                  aria-label={`Choose ${plan.name}`}
                >
                  {pending === plan.name ? 'Opening…' : 'Choose'}
                </Button>
              </li>
            ))}
          </ul>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-foreground"
            >
              {error}
            </p>
          ) : null}

          <p className="tc-path mt-4 text-muted-foreground">{CREDITS_NOTE}</p>

          {onViewPlans ? (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onViewPlans();
              }}
              className="tc-path mt-3 inline-flex items-center gap-1 text-signal underline decoration-signal/30 underline-offset-2 hover:decoration-signal"
            >
              See what each plan includes
              <Lineicons icon={ArrowRightOutlined as any} size={12} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------------------
   The provider
   The shell mounts one of these, so every surface below it — rail, banner,
   plate — reaches the same dialog and none of them owns state or markup for
   asking. `reason` rides along to checkout metadata: which ask converts is
   worth knowing, and it costs one string to find out.

   The dialog stays rendered and closed rather than being conditionally mounted.
   Radix puts no DOM on the page for a closed dialog, so the saving would be
   nothing, and unmounting on close throws away the exit animation — the panel
   would vanish mid-fade instead of leaving.
   -------------------------------------------------------------------------- */

export function TopUpProvider({
  credits,
  onViewPlans,
  children,
}: {
  credits: CreditState;
  onViewPlans?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);

  const value = useMemo<TopUpContextValue>(
    () => ({
      open: (next) => {
        setReason(next);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <TopUpContext.Provider value={value}>
      {children}
      <TopUpDialog
        open={open}
        onOpenChange={setOpen}
        state={credits}
        reason={reason}
        onViewPlans={onViewPlans}
      />
    </TopUpContext.Provider>
  );
}
