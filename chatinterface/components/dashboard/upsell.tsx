'use client';

import type { ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { ArrowRightOutlined, Bolt2Outlined, CheckCircle1Outlined } from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/components/landing/pricing-cards';
import { useTopUp } from './topup-context';

/* ==========================================================================
   Credits, and asking for more of them
   --------------------------------------------------------------------------
   A credit is spent to create a chatbot, so credits are the one number in this
   product that runs out. Two things follow, and this file is where both live:

     1. A depleting quantity is a *bar*, not a digit. "12" tells a customer
        nothing; a bar two-thirds empty tells them to act. The bar changes hue
        as it drains, which is the upgrade prompt working before any copy has
        to say a word.

     2. Asking for money works when the ask sits next to proof the product did
        something. `ValueProof` counts answers the customer's team did not have
        to write, from the real message total — and labels the time estimate as
        an estimate, with the per-ticket assumption stated. No invented figure
        earns anyone's card details twice.

   Ink plate, never the marker. The marker means "this is the passage the
   answer came from" and pointing it at a checkout button would spend the one
   piece of brand vocabulary the product has.
   ========================================================================== */

/** Credits a paid plan grants, read from the same list checkout bills against. */
function planAllowance(plan: string): number | null {
  const match = PLANS.find((entry) => entry.name.toLowerCase() === plan.trim().toLowerCase());
  return match?.credits ?? null;
}

export function planLabel(plan: unknown): string {
  const raw = String(plan ?? '').trim();
  if (!raw) return 'Free';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export type CreditState = {
  credits: number | null;
  trials: number | null;
  /** Total the bar is measured against, when we can know one. */
  allowance: number | null;
  pct: number;
  level: 'ok' | 'low' | 'empty';
  /** Credits plus trials — what the customer can actually spend today. */
  spendable: number;
  plan: string;
};

/* Low at a third remaining, empty at nothing. Trials count as spendable but
   not toward the bar: they are a different currency and a plan does not top
   them up. */
export function readCredits(userProfile: any): CreditState {
  const credits = Number.isFinite(Number(userProfile?.credits)) ? Number(userProfile.credits) : null;
  const trials = Number.isFinite(Number(userProfile?.freeTrialRemaining))
    ? Number(userProfile.freeTrialRemaining)
    : null;
  const plan = planLabel(userProfile?.plan);
  const granted = planAllowance(plan);

  // Without a plan allowance the customer's own high-water mark is the only
  // honest denominator available.
  const allowance = granted ?? (credits !== null && credits > 0 ? Math.max(credits, 10) : null);
  const pct = allowance && credits !== null ? Math.round((credits / allowance) * 100) : 0;
  const spendable = (credits ?? 0) + (trials ?? 0);

  const level: CreditState['level'] =
    spendable <= 0 ? 'empty' : credits !== null && allowance !== null && credits / allowance <= 0.34 ? 'low' : 'ok';

  return { credits, trials, allowance, pct: Math.max(0, Math.min(100, pct)), level, spendable, plan };
}

/* --------------------------------------------------------------------------
   The meter
   -------------------------------------------------------------------------- */

export function CreditMeter({
  state,
  onPlate = false,
  className,
}: {
  state: CreditState;
  onPlate?: boolean;
  className?: string;
}) {
  const { credits, allowance, pct, level } = state;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('tc-eyebrow', onPlate && 'text-plate-quiet')}>Credits</span>
        <span className={cn('tc-num font-mono text-[0.9375rem]', onPlate ? 'text-plate-foreground' : 'text-foreground')}>
          {credits === null ? '—' : credits.toLocaleString()}
          {allowance !== null ? (
            <span className={onPlate ? 'text-plate-quiet' : 'text-muted-foreground'}>
              {' / '}
              {allowance}
            </span>
          ) : null}
        </span>
      </div>
      <div
        className="tc-meter"
        data-level={level}
        data-on-plate={onPlate || undefined}
        style={{ ['--tc-fill' as any]: `${pct}%` }}
        role="meter"
        aria-valuenow={credits ?? 0}
        aria-valuemin={0}
        aria-valuemax={allowance ?? 100}
        aria-label="Credits remaining"
      >
        <span className="tc-meter-bar" />
      </div>
    </div>
  );
}

/** Header control: the number, a bar, and a way to buy more in one target. */
export function CreditsPill({ state, className }: { state: CreditState; className?: string }) {
  const { credits, trials, level, pct } = state;
  const urgent = level !== 'ok';
  const topUp = useTopUp();

  return (
    <button
      type="button"
      onClick={() => topUp.open('credits-pill')}
      className={cn(
        'group tc-lift inline-flex h-9 items-center gap-3 rounded-lg border bg-card px-3',
        urgent ? 'border-warning-border bg-warning-soft' : 'border-border',
        className,
      )}
    >
      <span className="flex flex-col gap-1">
        <span className="flex items-baseline gap-1.5">
          <span className="tc-eyebrow">Credits</span>
          <span className="tc-num font-mono text-[0.9375rem] text-foreground">
            {credits === null ? '—' : credits.toLocaleString()}
          </span>
        </span>
        <span
          className="tc-meter h-1 w-24"
          data-level={level}
          style={{ ['--tc-fill' as any]: `${pct}%` }}
          aria-hidden="true"
        >
          <span className="tc-meter-bar" />
        </span>
      </span>

      {trials !== null && trials > 0 ? (
        <>
          <span aria-hidden="true" className="h-6 w-px bg-border" />
          <span className="flex items-baseline gap-1.5">
            <span className="tc-eyebrow">Trials</span>
            <span className="tc-num font-mono text-[0.9375rem] text-foreground">{trials}</span>
          </span>
        </>
      ) : null}

      <span
        aria-hidden="true"
        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
      >
        <Lineicons icon={ArrowRightOutlined as any} size={14} />
      </span>
      <span className="sr-only">{urgent ? 'Add credits' : 'View plans and add credits'}</span>
    </button>
  );
}

/* --------------------------------------------------------------------------
   Proof, then the ask
   -------------------------------------------------------------------------- */

/** Minutes a support agent spends on one routine question. Stated in the UI
    beside every figure derived from it, because a number whose basis is hidden
    is a number a customer is right to distrust. */
export const MINUTES_PER_TICKET = 4;

export function hoursSaved(messages: number): number {
  return (messages * MINUTES_PER_TICKET) / 60;
}

export function formatHours(value: number): string {
  if (value < 1) return `${Math.round(value * 60)} min`;
  if (value < 10) return `${value.toFixed(1)} hrs`;
  return `${Math.round(value).toLocaleString()} hrs`;
}

/** What the product has actually done, from figures a response really carried. */
export function ValueProof({
  messages,
  pagesRead,
  onPlate = false,
  className,
}: {
  messages: number | null;
  pagesRead: number | null;
  onPlate?: boolean;
  className?: string;
}) {
  const quiet = onPlate ? 'text-plate-quiet' : 'text-muted-foreground';
  const loud = onPlate ? 'text-plate-foreground' : 'text-foreground';

  if (messages === null || messages <= 0) {
    return (
      <p className={cn('tc-body', quiet, className)}>
        Once your chatbot starts answering, the questions it handled — and the time that
        gave your team back — show up here.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <p className={cn('tc-body', quiet)}>
        Turbochat has answered{' '}
        <span className={cn('tc-num font-mono', loud)}>{messages.toLocaleString()}</span>{' '}
        {messages === 1 ? 'question' : 'questions'} from your own pages
        {pagesRead !== null && pagesRead > 0 ? (
          <>
            {' '}— all{' '}
            <span className={cn('tc-num font-mono', loud)}>{pagesRead.toLocaleString()}</span> of
            them
          </>
        ) : null}
        . That is {messages === 1 ? 'a ticket' : 'tickets'} your team never opened.
      </p>
      <p className={cn('tc-path', quiet)}>
        ≈ <span className={cn('tc-num', loud)}>{formatHours(hoursSaved(messages))}</span> of support
        time, at {MINUTES_PER_TICKET} min a ticket
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The ask
   -------------------------------------------------------------------------- */

/** The plate. One per screen, and only where money is the point. */
export function UpgradePlate({
  state,
  messages,
  pagesRead,
  className,
  children,
}: {
  state: CreditState;
  messages?: number | null;
  pagesRead?: number | null;
  className?: string;
  children?: ReactNode;
}) {
  const { level, plan, credits } = state;
  const topUp = useTopUp();

  const headline =
    level === 'empty'
      ? 'You are out of credits'
      : level === 'low'
        ? 'Running low on credits'
        : `You are on ${plan}`;

  const line =
    level === 'empty'
      ? 'Add credits to point Turbochat at your next site. Everything already answering stays answering.'
      : level === 'low'
        ? `${credits === null ? 'What is left' : `${credits} left`} — enough for ${credits === 1 ? 'one more chatbot' : 'a few more chatbots'}. Top up before you need it.`
        : 'Add credits whenever you want another site reading and answering.';

  return (
    <section className={cn('tc-plate p-6 sm:p-7', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-xl space-y-4">
          <p className="tc-eyebrow text-plate-quiet">/billing</p>
          <h2 className="tc-display tc-display-md text-plate-foreground">{headline}</h2>
          {messages !== undefined ? (
            <ValueProof messages={messages ?? null} pagesRead={pagesRead ?? null} onPlate />
          ) : null}
          <p className="tc-body text-plate-quiet">{line}</p>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-64">
          <CreditMeter state={state} onPlate />
          {/* One control. The plate only ever renders on Plan & usage, where
              the full comparison is already the next thing down the page — a
              "compare plans" link here pointed at the screen it was sitting on. */}
          <Button
            size="lg"
            variant="on-plate"
            className="w-full shadow-none"
            onClick={() => topUp.open('upgrade-plate')}
          >
            <Lineicons icon={Bolt2Outlined as any} size={16} aria-hidden="true" />
            {level === 'ok' ? 'Add credits' : 'Add credits now'}
          </Button>
        </div>
      </div>
      {children}
    </section>
  );
}

/* A narrow banner for screens whose own subject is not billing. Renders
   nothing while credits are healthy, so it cannot become wallpaper. */
export function LowCreditsBanner({
  state,
  className,
}: {
  state: CreditState;
  className?: string;
}) {
  const topUp = useTopUp();

  if (state.level === 'ok') return null;

  const empty = state.level === 'empty';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border px-4 py-3',
        empty ? 'border-danger-border bg-danger-soft' : 'border-warning-border bg-warning-soft',
        className,
      )}
    >
      <p className="min-w-0 text-sm text-foreground">
        <span className="font-medium">
          {empty ? 'No credits left.' : `${state.credits ?? 0} credits left.`}
        </span>{' '}
        <span className="text-muted-foreground">
          {empty
            ? 'Your live chatbots keep answering — you need credits to add another.'
            : 'Top up before your next chatbot.'}
        </span>
      </p>
      <Button
        size="sm"
        variant={empty ? 'plate' : 'outline'}
        onClick={() => topUp.open('low-credits-banner')}
      >
        Add credits
      </Button>
    </div>
  );
}

/** A quiet confirmation, for the moment a plan is healthy and nothing is asked. */
export function PlanTag({ state }: { state: CreditState }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 tc-micro text-muted-foreground">
      <Lineicons
        icon={CheckCircle1Outlined as any}
        size={11}
        aria-hidden="true"
        className="text-success"
      />
      {state.plan}
    </span>
  );
}
