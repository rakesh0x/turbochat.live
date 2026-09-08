'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  OnboardingBrand,
  OnboardingFrame,
  OnboardingSkeleton,
  type StepDirection,
} from '@/components/onboarding/frame';
import { AgentPreview } from '@/components/onboarding/preview';
import { StepPurpose } from '@/components/onboarding/step-purpose';
import { StepSource } from '@/components/onboarding/step-source';
import { StepShape } from '@/components/onboarding/step-shape';
import { StepChannels } from '@/components/onboarding/step-channels';
import { StepDiscovery } from '@/components/onboarding/step-discovery';
import { StepBuild } from '@/components/onboarding/step-build';
import {
  EMPTY_DRAFT,
  STEP_ORDER,
  canAdvance,
  hostOf,
  loadDraft,
  loadStep,
  markOnboarded,
  resolveFirstRun,
  saveDraft,
  saveStep,
  type Draft,
  type StepId,
} from '@/lib/onboarding';

/* ==========================================================================
   First run  ·  /onboarding
   --------------------------------------------------------------------------
   This file owns three things and delegates the rest: which question is on
   screen, the answers so far, and what happens when the flow ends. The
   questions themselves are in `components/onboarding/step-*.tsx`, the chrome
   is in `frame.tsx`, and the shape of the answers is in `lib/onboarding.ts`.

   Four decisions worth stating, because each replaced something worse:

   · A returning customer is never walked through the survey again. Arriving
     with a chatbot already in the account collapses the flow to the three
     steps that actually build one. The previous version instead redirected to
     /dashboard the moment the bot list came back non-empty — which, since the
     console's own "New chatbot" button lands here, meant an existing customer
     could never create a second bot.

   · The place is in the URL (`?step=source`). A refresh three questions in
     used to start over, and the browser's back button walked out of the
     product rather than back one question.

   · Answers survive a refresh. They are kept in localStorage, not on the
     server: there is no endpoint that stores a survey, and inventing one
     would be backend work this flow does not need.

   · Skipping is allowed and is not the same as finishing. Skip records that
     we should stop sending this person here and keeps the draft; finishing
     spends it. Both are in `lib/onboarding.ts` as `resolveFirstRun` and
     `markOnboarded`.
   ========================================================================== */

/** Short names for the frame's progress read-out. */
const STEP_LABELS: Record<StepId, string> = {
  purpose: 'Purpose',
  source: 'Source',
  shape: 'Answers',
  channels: 'Channels',
  discovery: 'Referral',
  build: 'Build',
};

/* Someone adding their second chatbot has already told us what they are
   building and where they found us. Asking twice is how a product tells a
   customer it was not listening. */
const RETURNING_FLOW: readonly StepId[] = ['source', 'shape', 'build'] as const;

/* A scroll asked for in JavaScript does not inherit the `scroll-behavior`
   override that quietens CSS animations for a reader who asked for less
   motion, so it has to ask the same question itself. */
function wantsLessMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState<StepId>('purpose');
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  const startedRef = useRef(false);

  const flow = useMemo<readonly StepId[]>(
    () => (returning ? RETURNING_FLOW : STEP_ORDER),
    [returning],
  );

  /* The frame names each step for a screen reader, and only this file knows
     which steps are in play — a returning customer's progress is three long,
     not six. */
  const stepLabels = useMemo(() => flow.map((id) => STEP_LABELS[id]), [flow]);

  const index = Math.max(0, flow.indexOf(step));

  /* Which way the flow just moved, so the step can enter from the side it
     came from. Held in a ref and compared during render rather than set at
     each call site: `go`, the browser's own Back button through `popstate`,
     and the returning-customer collapse all arrive at a new index by
     different routes, and one comparison covers every one of them — including
     future ones. The comparison itself runs below the loading gates, because
     the index shuffles while the flow is still being decided and none of that
     is somebody moving through the survey. */
  const directionRef = useRef<StepDirection>('forward');
  const lastIndexRef = useRef(index);

  /* ---- boot ---------------------------------------------------------------
     Read the URL and the saved draft after mount, not in a lazy initializer:
     the server renders without a query string or a localStorage, so reading
     either during the first render hands React two different trees. */
  useEffect(() => {
    setDraft(loadDraft());
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('step');
    const resolved = (STEP_ORDER as readonly string[]).includes(String(fromUrl))
      ? (fromUrl as StepId)
      : loadStep();
    if (resolved) setStep(resolved);
    setHydrated(true);
  }, []);

  /* Is this a first run at all? The bot list is the only honest answer. The
     local marker decides something different — whether the console *pushes*
     someone here — and lives in `TrainingChatbotsUI`. */
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      setReturning(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/chatbots');
        if (!res.ok) throw new Error(String(res.status));
        const list = await res.json();
        if (!cancelled) setReturning(Array.isArray(list) && list.length > 0);
      } catch {
        // If we cannot tell, treat them as new. Showing one extra question is
        // a smaller failure than blocking someone out of their first chatbot.
        if (!cancelled) setReturning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, sessionStatus]);

  /* A returning customer who lands mid-survey is moved to the first step of
     the shorter flow rather than shown a question that is no longer in it. */
  useEffect(() => {
    if (returning === null || !hydrated) return;
    if (!flow.includes(step)) setStep(flow[0]);
  }, [returning, hydrated, flow, step]);

  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveStep(step);
    const params = new URLSearchParams(window.location.search);
    params.set('step', step);
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  }, [step, hydrated]);

  useEffect(() => {
    function onPop() {
      const raw = new URLSearchParams(window.location.search).get('step');
      if ((STEP_ORDER as readonly string[]).includes(String(raw))) setStep(raw as StepId);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* One event per question reached, once each. Without the ref this fires
     again every time the customer steps backward through the flow. */
  const seenRef = useRef<Set<StepId>>(new Set());
  useEffect(() => {
    if (!hydrated || returning === null || seenRef.current.has(step)) return;
    seenRef.current.add(step);
    posthog.capture('onboarding_step_viewed', { step, index, returning });
  }, [step, index, hydrated, returning]);

  useEffect(() => {
    if (!hydrated || returning === null || startedRef.current) return;
    startedRef.current = true;
    posthog.capture('onboarding_started', { returning, steps: flow.length });
  }, [hydrated, returning, flow.length]);

  /* ---- navigation --------------------------------------------------------- */

  const patch = useCallback((next: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...next }));
  }, []);

  const go = useCallback(
    (target: StepId, mode: 'push' | 'replace' = 'push') => {
      setStep(target);
      const params = new URLSearchParams(window.location.search);
      params.set('step', target);
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](
        null,
        '',
        `${window.location.pathname}?${params}`,
      );
      window.scrollTo({ top: 0, behavior: wantsLessMotion() ? 'auto' : 'smooth' });
    },
    [],
  );

  const next = useCallback(() => {
    const at = flow.indexOf(step);
    if (at < 0 || at >= flow.length - 1) return;
    posthog.capture('onboarding_step_completed', { step, index: at });
    go(flow[at + 1]);
  }, [flow, step, go]);

  const back = useCallback(() => {
    const at = flow.indexOf(step);
    if (at <= 0) return;
    go(flow[at - 1]);
  }, [flow, step, go]);

  /* Backwards only, and the frame agrees: it draws the completed steps as
     buttons and everything else as text. The same rule is enforced here on the
     way in, because a progress indicator and the navigation it triggers must
     not be able to disagree about what is reachable — a forward jump would
     land on a question whose answer the screen before it has not produced.

     No analytics event: `onboarding_step_viewed` already fires once per step
     and deliberately does not fire again on the way back. */
  const jump = useCallback(
    (position: number) => {
      const at = flow.indexOf(step);
      if (at < 0 || position < 0 || position >= at) return;
      go(flow[position]);
    },
    [flow, step, go],
  );

  /* Leaving is a state, not a jump cut: the customer watched a crawl finish
     and deserves a beat that says where they are going. */
  const leaveFor = useCallback(
    (reason: 'completed' | 'skipped', bot?: any) => {
      setLeaving(true);
      if (reason === 'completed') markOnboarded();
      else resolveFirstRun();
      posthog.capture(`onboarding_${reason}`, {
        purpose: draft.purpose,
        tone: draft.tone,
        channels: draft.channels,
        tools: draft.tools,
        discovery: draft.discovery,
        discovery_detail: draft.discoveryDetail || undefined,
        problem_given: draft.problem.trim().length > 0,
        crawl_limit: draft.crawlLimit,
        site: hostOf(draft.website) || undefined,
        chatbot_id: bot?.id ?? bot?._id ?? undefined,
      });
    },
    [draft],
  );

  /* The hand-off runs from an effect rather than a `setTimeout` inside the
     click handler, so React can cancel it. A timer that outlives the
     component and then calls `router.push` is the same bug this codebase
     already had once in the create wizard. */
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => router.push('/dashboard'), 480);
    return () => window.clearTimeout(timer);
  }, [leaving, router]);

  const onComplete = useCallback(
    (bot: any) => {
      toast.success('Your chatbot is answering. Embed it whenever you are ready.');
      leaveFor('completed', bot);
    },
    [leaveFor],
  );

  /* ---- render ------------------------------------------------------------- */

  /* The loading state is the frame with its content still resolving, not a
     centred wordmark: how many steps there are depends on the bot list, and a
     screen that has to re-lay itself out the moment that lands is a jump the
     reader reads as slowness. */
  if (sessionStatus === 'loading' || !hydrated || returning === null) {
    return <OnboardingSkeleton />;
  }

  /* The curtain, and it has to read as one. The bar is the 480ms hand-off
     timer drawn out: it finishes as the route changes, so the wait and the
     arrival are a single movement instead of half a second of nothing. */
  if (leaving) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="animate-tc-rise flex w-full max-w-[13rem] flex-col items-center gap-3">
          <OnboardingBrand />
          <p className="tc-eyebrow">opening your console</p>
          <span
            aria-hidden="true"
            className="mt-0.5 block h-px w-full overflow-hidden rounded-full bg-border-strong"
          >
            <span className="animate-tc-progress block h-full w-full rounded-full bg-signal" />
          </span>
        </div>
      </main>
    );
  }

  if (index !== lastIndexRef.current) {
    directionRef.current = index < lastIndexRef.current ? 'back' : 'forward';
    lastIndexRef.current = index;
  }

  const stepProps = { draft, patch, next, back };

  function question() {
    switch (step) {
      case 'source':
        return <StepSource {...stepProps} />;
      case 'shape':
        return <StepShape {...stepProps} />;
      case 'channels':
        return <StepChannels {...stepProps} />;
      case 'discovery':
        return <StepDiscovery {...stepProps} />;
      case 'build':
        return <StepBuild draft={draft} onComplete={onComplete} onBack={back} />;
      case 'purpose':
      default:
        return <StepPurpose {...stepProps} />;
    }
  }

  return (
    <>
      <Toaster />
      <OnboardingFrame
        index={index}
        total={flow.length}
        stepLabel={STEP_LABELS[step]}
        stepLabels={stepLabels}
        direction={directionRef.current}
        /* Not on the last step. Its crawl is a running job with a poll behind
           it, so a segment that quietly unmounted it mid-build would abandon a
           chatbot that already exists — and the step offers its own way back in
           the two phases where leaving is safe. */
        onJump={step === 'build' ? undefined : jump}
        onBack={back}
        onNext={next}
        canBack={index > 0}
        canNext={canAdvance(step, draft)}
        hideFooter={step === 'build'}
        onSkip={returning ? undefined : () => leaveFor('skipped')}
        exitHref={returning ? '/dashboard' : undefined}
        aside={<AgentPreview draft={draft} />}
      >
        {question()}
      </OnboardingFrame>
    </>
  );
}
