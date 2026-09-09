'use client';

import { useEffect, useState } from 'react';
import {
  BotpressOutlined,
  CreditCardMultipleOutlined,
  Database2Outlined,
  Message2Outlined,
} from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BillingPageProps } from '@/lib/types/ui';
import {
  Bone,
  EmptyState,
  Fact,
  Hairline,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  SectionTitle,
  StatGrid,
  StatTile,
  TileSkeleton,
  compact,
  exact,
  num,
  plural,
} from '@/components/dashboard/kit';
import {
  CreditMeter,
  PlanTag,
  UpgradePlate,
  ValueProof,
  readCredits,
} from '@/components/dashboard/upsell';
import { CHECKOUT_PLANS, CREDITS_NOTE, PlanCard } from '@/components/landing/pricing-cards';
import { useCheckout } from '@/components/dashboard/topup';

/* ==========================================================================
   Plan & usage — /dashboard?p=billing
   --------------------------------------------------------------------------
   The screen a customer opens while deciding whether to pay, so it answers
   three questions in that order: what have I got left, what has it done for
   me, and what would more of it cost.

   Not one price, credit count or Dodo product id is typed in this file. Every
   plan fact comes from components/landing/pricing-cards.tsx — the same list
   the checkout call bills against — and every action that would spend money
   goes through `useCheckout`, shared with the credits dialog. Two surfaces
   quoting a price is how a customer ends up billed for something they did not
   read, and two surfaces posting their own checkout is how they get billed for
   the wrong thing entirely.
   ========================================================================== */

const SHELL = 'mx-auto w-full max-w-6xl space-y-6 pb-12 sm:space-y-7';

const TITLE = 'Your plan, and what is left on it';
const INTRO =
  'Credits are spent when you point Turbochat at a new site. Whatever your balance, every chatbot already answering keeps answering.';

/* A date the profile really carried, and only while it is still ahead of us.
   The account API stringifies whatever the column holds, so an absent value
   arrives as the text "None" — printing that as a renewal date, or printing a
   date that has already passed as one, would both be lies. */
function renewalDate(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw || raw === 'None' || raw === 'null' || raw === 'undefined') return null;

  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  const time = parsed.getTime();
  if (Number.isNaN(time) || time <= Date.now()) return null;

  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Loading holds the finished layout, so nothing jumps when the account read
   lands: header, the credit panel, three tiles, the plate, the plan ladder. */
function BillingSkeleton() {
  return (
    <div className={SHELL} role="status" aria-live="polite">
      <span className="sr-only">Loading your plan and usage</span>

      <div className="space-y-2.5">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-8 w-full max-w-sm" />
        <Bone className="h-2.5 w-full max-w-md" />
      </div>

      <div className="tc-panel">
        <div className="space-y-2 px-6 pt-5 pb-4 sm:px-7">
          <Bone className="h-3.5 w-28" />
          <Bone className="h-2.5 w-52 max-w-full" />
        </div>
        <div className="grid gap-6 px-6 pb-6 sm:px-7 md:grid-cols-2">
          <div className="space-y-3">
            <Bone className="h-2.5 w-24" />
            <Bone className="h-10 w-28" />
            <Bone className="h-1.5 w-full" />
            <Bone className="h-2.5 w-40" />
          </div>
          <Bone className="h-28 w-full" />
        </div>
      </div>

      <StatGrid className="xl:grid-cols-3">
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
      </StatGrid>

      <Bone className="h-52 w-full rounded-xl sm:h-44" />

      <div className="grid gap-3.5 lg:grid-cols-3">
        <Bone className="h-72 w-full rounded-xl" />
        <Bone className="h-72 w-full rounded-xl" />
        <Bone className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function BillingPage({ userProfile, stats, chatbotCount }: BillingPageProps) {
  /* This view is handed no `loading` flag, so an absent profile is ambiguous:
     the shell's account read may still be in flight, or it may have failed.
     Hold the layout in skeletons briefly, then say so plainly — a skeleton
     that never resolves tells a customer nothing about their money. */
  const [waited, setWaited] = useState(false);
  const { start, pending, error: checkoutError } = useCheckout('billing-plans');

  useEffect(() => {
    if (userProfile) {
      setWaited(false);
      return;
    }
    const timer = window.setTimeout(() => setWaited(true), 6000);
    return () => window.clearTimeout(timer);
  }, [userProfile]);

  if (!userProfile) {
    if (!waited) return <BillingSkeleton />;

    // No plan name is guessed here. We do not know it, so we do not print one.
    return (
      <div className={SHELL}>
        <PageHeader eyebrow="/billing" title={TITLE} description={INTRO} />
        <EmptyState
          icon={CreditCardMultipleOutlined}
          title="We could not read your account"
          body="Your plan, credits and free trials live on your account, and that request did not come back. Reload and they should appear. Your chatbots are unaffected — they keep answering either way."
          action={
            <Button variant="outline" asChild>
              <a href="/dashboard?p=billing">Reload this page</a>
            </Button>
          }
        />
      </div>
    );
  }

  const credits = readCredits(userProfile);
  const messages = num(stats?.totalMessages);
  const pagesRead = num(stats?.totalPages);
  const answering = num(stats?.activeBots);
  const renews = renewalDate(userProfile?.freeTrialResetAt);

  /* `spendable` sums credits and trials, so it reads 0 when we hold neither
     figure. That would be a stand-in zero, and this codebase does not print
     those. */
  const knowsSpendable = credits.credits !== null || credits.trials !== null;

  return (
    <div className={SHELL}>
      <PageHeader
        eyebrow="/billing"
        title={TITLE}
        description={INTRO}
        meta={
          <>
            {/* The plan, and a date only when the profile really carried one.
                The balance itself is not repeated here — it is the figure at
                the top of the panel below, and saying it three times on one
                screen makes none of them the answer. */}
            <PlanTag state={credits} />
            {renews ? <Fact label="Free trial resets" value={renews} /> : null}
          </>
        }
      />

      {/* What is left, and what it has already bought — side by side, because
          a balance means nothing without the work it paid for. */}
      <Panel>
        <PanelHeader
          title="Credits"
          description="One balance, spent when a new site starts being read."
        />
        <PanelBody className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="min-w-0 space-y-4">
            <div className="space-y-1.5">
              <p className="tc-eyebrow">Spendable now</p>
              <p className="tc-figure tc-figure-lg text-foreground">
                {knowsSpendable ? credits.spendable.toLocaleString() : '—'}
              </p>
              <p className="tc-path text-muted-foreground">credits + free trials</p>
            </div>

            <CreditMeter state={credits} />

            <Hairline />

            <div className="space-y-1.5">
              <dl className="flex items-baseline justify-between gap-3">
                <dt className="tc-eyebrow">Free trials</dt>
                <dd className="tc-num font-mono text-[0.9375rem] text-foreground">
                  {exact(credits.trials)}
                </dd>
              </dl>
              <p className="tc-meta text-muted-foreground">
                Trials are spendable, and they sit outside the bar above.
              </p>
            </div>
          </div>

          <div className="tc-inset min-w-0 p-4 sm:p-5">
            <p className="tc-eyebrow">What Turbochat has handled</p>
            <ValueProof messages={messages} pagesRead={pagesRead} className="mt-3" />
          </div>
        </PanelBody>
        <PanelFooter>
          <p className="tc-meta text-muted-foreground">{CREDITS_NOTE}</p>
        </PanelFooter>
      </Panel>

      {/* Usage, only from figures the account and stats reads actually carried.
          A tile with nothing behind it shows an em dash, not a zero. */}
      <StatGrid className="xl:grid-cols-3">
        <StatTile
          label="Chatbots created"
          value={exact(chatbotCount)}
          icon={BotpressOutlined}
          note={
            answering === null
              ? undefined
              : `${answering.toLocaleString()} ${plural(answering, 'chatbot')} answering now`
          }
        />
        <StatTile
          label="Questions answered"
          value={compact(messages)}
          icon={Message2Outlined}
        />
        <StatTile
          label="Pages read"
          value={compact(pagesRead)}
          icon={Database2Outlined}
          note={
            chatbotCount > 0
              ? `across ${chatbotCount.toLocaleString()} ${plural(chatbotCount, 'chatbot')}`
              : undefined
          }
        />
      </StatGrid>

      {/* The one plate on this screen, and the one loud control. The proof was
          made above, so `messages` is deliberately not passed: the plate would
          render a second copy of those same lines. */}
      <UpgradePlate state={credits} />

      <section className="space-y-3.5">
        <SectionTitle>What each plan adds</SectionTitle>
        <p className="max-w-prose tc-body text-muted-foreground">
          Choosing a plan opens checkout straight away. You land back on this screen once
          the payment goes through, with the credits already counted.
        </p>

        {/* Names, prices, credit counts and features come straight from the
            shared plan list, and every button posts through the one shared
            checkout hook. Nothing about a plan, and no product id, is restated
            on this screen. */}
        <div className="grid gap-3.5 lg:grid-cols-3">
          {CHECKOUT_PLANS.map((plan) => {
            const current = plan.name.toLowerCase() === credits.plan.toLowerCase();

            return (
              <div
                key={plan.name}
                className={cn(
                  'relative flex min-w-0 flex-col [&>article]:flex-1',
                  // The recommended plan sits a little taller than its
                  // neighbours on wide screens. Ink carries it, never the marker.
                  plan.featured && 'lg:z-10 lg:-my-2',
                )}
              >
                <PlanCard
                  plan={plan}
                  scale="sheet"
                  action={
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant={plan.featured ? 'secondary' : 'outline'}
                        className="w-full"
                        onClick={() => start(plan)}
                        disabled={pending !== null}
                      >
                        {pending === plan.name
                          ? 'Opening checkout…'
                          : current
                            ? 'Add credits'
                            : `Choose ${plan.name}`}
                      </Button>
                      {current ? (
                        <p
                          className={cn(
                            'tc-path text-center',
                            plan.featured
                              ? 'text-primary-foreground/75'
                              : 'text-muted-foreground',
                          )}
                        >
                          Your current plan
                        </p>
                      ) : null}
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>

        {/* A checkout that fails silently is a customer who thinks the button is
            broken and stops trying. */}
        {checkoutError ? (
          <p
            role="alert"
            className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-foreground"
          >
            {checkoutError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
