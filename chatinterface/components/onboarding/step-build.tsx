'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useSession } from 'next-auth/react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  Globe1Outlined,
  Rocket5Outlined,
  Spinner3Outlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import {
  ErrorState,
  Fact,
  KeyValue,
  LiveTag,
  Mono,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  StatusPill,
  exact,
  plural,
} from '@/components/dashboard/kit';
import { StepBody, StepHeading } from '@/components/onboarding/parts';
import { hostOf, normalizeSite, type Draft } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

/* ==========================================================================
   First run · step 6 · the build
   --------------------------------------------------------------------------
   The screen the flow exists for. It creates the chatbot and then watches a
   crawl that takes a minute or two, so almost all of the work here is making
   that minute legible: a stage rail, a meter, a timestamped build log, and a
   sentence in plain language saying what the crawler is doing right now.

   The creation logic is ported unchanged from `components/createChatbot.tsx`
   — same `POST /api/chatbot/create` with `{ name, website, limit }`, same
   `detail`/`message`/`error` unwrapping, same 402 branch, same
   `GET /api/chatbots` poll every 3000ms, same `completionTriggeredRef` guard,
   same posthog events and properties. Two deliberate differences, both about
   this screen rather than the API: failures render inline with a retry
   instead of a toast that vanishes, and the success state waits for a click
   instead of auto-advancing after 1800ms — a payoff nobody gets to read is
   not a payoff. The credit pre-flight against `/api/users/me` is not ported
   because it needs `canCreateChatbot`/`onBlocked`, which this step is not
   given; the 402 branch is the guard that actually holds.

   What this screen refuses to fabricate: no model name, no page count, no
   completion percentage of its own. `createdBot.pagesScraped` is the only
   page figure, and a row it cannot fill from the response is omitted rather
   than approximated. The bar is the one estimate, and it is labelled as
   progress and structurally cannot claim 100% before the poll says so.

   The stage rail obeys the same rule, and it is the rule that shaped it: a
   stage ticks when the create response or the poll says so, and never on a
   timer. Against a backend that never reports `indexing`, that stage stays
   dark for the whole run and the crawl stage carries the wait — which is the
   honest picture. A rail that advanced itself on elapsed time would be a
   progress bar wearing a checklist's clothes, and the first person to watch
   it tick "indexing" on a site that was already failing would never trust a
   number on this screen again.
   ========================================================================== */

/* The bar's fixed points. ACCEPTED is the moment the POST left, CREATED the
   moment the API handed back an id — both real events. CEILING is the most
   the bar may claim while the poll still reports work in progress, and 100 is
   written in exactly one place: the branch where the poll says `active`. */
const ACCEPTED = 10;
const CREATED = 30;
const CEILING = 92;

/* Only used to keep the bar moving between two real events, never to claim a
   page was read. A generous per-page estimate is better than a bar that
   sprints to the ceiling and sits there. */
const MS_PER_PAGE = 4_500;
const MIN_EXPECTED_MS = 30_000;
const MAX_EXPECTED_MS = 300_000;

/* The four stages the backend actually reports, so "step 2/4" is a real
   position rather than a guess. `pending` is stage one, `active` is the last. */
const STAGES = ['accepted', 'crawling', 'indexing', 'ready'] as const;

/* The same four, said out loud for the rail. Kept beside `STAGES` rather than
   inlined in the markup so the ids the header prints and the labels the reader
   sees cannot drift apart. */
const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  accepted: 'Created',
  crawling: 'Reading pages',
  indexing: 'Building the index',
  ready: 'Ready to answer',
};

function stageIndex(status: string): number {
  if (status === 'active') return 3;
  if (status === 'indexing' || status === 'training') return 2;
  if (status === 'crawling') return 1;
  return 0;
}

type Phase = 'ready' | 'creating' | 'crawling' | 'failed' | 'done';

/* Four states, not three. `queued` exists because `pending` is the one case
   where the backend explicitly says the record is made and the crawl has not
   begun — drawing that as in-flight would claim pages were being read, and
   drawing it as not-started would claim nothing was happening. */
type StageState = 'done' | 'live' | 'queued' | 'waiting';

const STATE_WORD: Record<StageState, string> = {
  done: 'done',
  live: 'now',
  queued: 'queued',
  waiting: 'not started',
};

/** What the code can prove about each stage. Nothing here reads the clock.
 *
 *  Two inputs, both facts: `phase`, which moves only when the create call
 *  returns or the poll answers, and the poll's own status through the
 *  existing `stageIndex`. The one thing added on top is that a `crawling`
 *  phase proves stage one finished — the POST came back with an id, which is
 *  a fact the poll never restates. */
function stageStates(phase: Phase, status: string): StageState[] {
  /* The POST is still out. Nothing exists yet, so the first stage is the only
     thing happening and the rest have not been reached. */
  if (phase === 'creating') return ['live', 'waiting', 'waiting', 'waiting'];

  const reported = stageIndex(status);
  const queued = status === 'pending';

  return STAGES.map((_, i): StageState => {
    if (i === 0) return 'done';
    if (queued) return i === 1 ? 'queued' : 'waiting';
    if (i < reported) return 'done';
    if (i === reported) return 'live';
    /* Between the create response and the first poll there is no status at
       all, so `reported` is 0. The crawl is what was asked for, so the crawl
       stage carries the wait — the same claim the headline already makes in
       this gap rather than a second, different one. */
    if (reported === 0 && i === 1) return 'live';
    return 'waiting';
  });
}

type LogLine = { text: string; timestamp: string };

/** `credits` is the 402: not retryable, so it is offered pricing instead. */
type Failure = { kind: 'create' | 'credits' | 'training'; title: string; body: string };

const stamp = () => new Date().toLocaleTimeString();

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/* The draft carries preset ids. Humanising the id cannot be wrong the way a
   hardcoded label map can drift from whatever step 1 currently offers. */
function humanise(value: string | null): string {
  const raw = (value ?? '').replace(/[-_]+/g, ' ').trim();
  if (!raw) return '';
  return `${raw.charAt(0).toUpperCase()}${raw.slice(1)}`;
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/* Server-reported status, said out loud. Only statuses the backend actually
   sends get a sentence; anything else is echoed verbatim rather than guessed
   at. */
function statusSentence(status: string): string | null {
  switch (status) {
    case 'crawling':
      return 'Fetching pages and following the links it finds.';
    case 'indexing':
      return 'Turning what it read into a searchable index.';
    case 'training':
      return 'Building the index it answers from.';
    case 'pending':
      return 'Queued behind the crawler. This is usually seconds.';
    default:
      return null;
  }
}

/* The standing line at the foot of the log, rotated on elapsed time so a long
   quiet stretch does not read as a hang. Every phrase describes what this
   page is doing, because that is the only thing the code knows between polls:
   there is no page count to report and no remaining time to promise, and "about
   a minute left" from a client that cannot see the queue is a guess dressed as
   an estimate. */
const WAIT_LINES = [
  'listening for the crawler…',
  'it reports back every few seconds…',
  'still going — nothing needed from you…',
  'this line updates itself…',
];

const WAIT_LINE_MS = 9_000;

/* ---- the rail -----------------------------------------------------------
   The wait, drawn as the sequence it is: what is finished, what is running,
   what has not started. This replaced a lone percentage, which is the same
   information with the interesting part removed — a number climbing to a
   ceiling tells a reader how long, and never what.

   Vertical, at every width. A four-across rail is the obvious layout and it
   was drawn first: at 360px it forces the four labels down to about 70px
   each, and "Building the index" truncated to "Buildin…" is worse than no
   label at all. Stacked, the labels are the thing that survives. */
function StageRail({ states }: { states: StageState[] }) {
  return (
    <ol aria-label="Build stages" className="relative -mx-1.5">
      {/* One hairline behind the whole column rather than a segment per row:
          the nodes are opaque, so they break the line themselves, and the
          live row clips its own overflow for the shimmer — a connector drawn
          inside it would be cut off at the row edge. Rows are a fixed 32px
          (20px node + py-1.5), which is what lets `top-4 bottom-4` land on
          the first and last node centres without measuring anything. */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 left-4 top-4 w-px bg-border"
      />
      {STAGES.map((id, i) => {
        const state = states[i] ?? 'waiting';
        const done = state === 'done';
        const live = state === 'live';

        return (
          <li
            key={id}
            aria-current={live ? 'step' : undefined}
            className={cn(
              'relative flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2.5',
              /* Colour is a transition, not an animation: the row exists
                 before and after the change, so there is nothing to enter. */
              'transition-colors duration-500 ease-out',
              live && 'tc-shimmer bg-signal-soft/60',
            )}
          >
            {done ? (
              /* The tick lands. Swapping the class on a node that is already
                 on screen starts `tc-tick` exactly once — when the server
                 agreed — where remounting it would replay on every poll. */
              <span className="animate-tc-tick flex size-5 shrink-0 items-center justify-center rounded-full border border-success-border bg-card">
                <Lineicons
                  icon={CheckOutlined}
                  className="size-2.5 text-success-ink"
                  aria-hidden="true"
                />
              </span>
            ) : live ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-signal-border bg-card">
                <span aria-hidden="true" className="tc-live-dot" />
              </span>
            ) : state === 'queued' ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 rounded-full border border-dashed border-border bg-card"
              />
            )}

            <span
              className={cn(
                'min-w-0 truncate tc-label',
                done ? 'text-foreground' : live ? 'text-signal-ink' : 'text-muted-foreground',
              )}
            >
              {STAGE_LABEL[id]}
            </span>

            {/* The state in a word, and not only in a colour or a pulse. Under
                `prefers-reduced-motion` the shimmer and the dot both stop, so
                this is what is left carrying "in flight" — which is why it is
                text and not a hue. */}
            <span className={cn('tc-eyebrow ml-auto shrink-0', live && 'text-signal-ink')}>
              {STATE_WORD[state]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* The log after the run, collapsed. It is the record of what was fetched, and
   the first question anyone asks about a thin answer is which pages it read —
   so it survives both the success screen and the failure screen. */
function LogHistory({ logs }: { logs: LogLine[] }) {
  if (logs.length === 0) return null;
  return (
    <details className="tc-inset overflow-hidden">
      <summary className="tc-path cursor-pointer list-none px-4 py-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        {`build log · ${exact(logs.length)} ${plural(logs.length, 'line')}`}
      </summary>
      <div className="max-h-56 overflow-y-auto border-t border-border bg-card px-4 py-3">
        <ol className="space-y-1.5 tc-micro leading-5">
          {logs.map((line, i) => (
            <li key={`${line.timestamp}-${i}`} className="flex gap-3">
              <span className="tc-num shrink-0 text-muted-foreground">{line.timestamp}</span>
              <span className="min-w-0 text-foreground">{line.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

export function StepBuild({
  draft,
  onComplete,
  onBack,
}: {
  draft: Draft;
  onComplete: (bot: any) => void;
  onBack: () => void;
}) {
  const { data: session } = useSession();

  const [phase, setPhase] = useState<Phase>('ready');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [createdBot, setCreatedBot] = useState<any>(null);
  /** Server-reported status, so the sentence above the log is not invented. */
  const [serverStatus, setServerStatus] = useState<string>('');
  /** Real pages, straight off the poll. `null` until the backend reports any. */
  const [pagesSeen, setPagesSeen] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const completionTriggeredRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  /* So a poll that repeats the same page count does not repeat the log line. */
  const lastLoggedPagesRef = useRef(0);
  const logRef = useRef<HTMLDivElement | null>(null);

  const site = normalizeSite(draft.website);
  const host = hostOf(draft.website);
  const budget = Math.max(1, Number(draft.crawlLimit) || 10);
  const name = draft.agentName.trim();
  const purpose = humanise(draft.purpose);
  const tone = humanise(draft.tone);
  const working = phase === 'creating' || phase === 'crawling';

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  /* Both intervals die with the component. A poll that outlives this screen
     keeps hitting /api/chatbots for the rest of the session. */
  useEffect(() => {
    return () => {
      stopPoll();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  /* The only reason anything re-renders between poll responses: it moves the
     bar and the clock, and it stops the moment the work does. */
  useEffect(() => {
    if (!working) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [working]);

  /* Scroll the well, not the document: the page must not jump under a reader
     every three seconds. */
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const log = (text: string) => setLogs((prev) => [...prev, { text, timestamp: stamp() }]);

  /* ---- the bar ----------------------------------------------------------
     Two inputs, and which one wins is decided by which one is real. Pages
     reported by the poll map onto CREATED..CEILING directly. Between poll
     responses, elapsed time against the page budget fills the gap so the bar
     is never frozen. Whichever reads higher wins, so it cannot go backwards.

     Nothing in this expression can reach 100: every branch that is not `done`
     is clamped to CEILING, and 100 is written only where the poll returned
     `active`. A bar that hits 100% and hangs is the failure being avoided.

     The easing is not here and deliberately not here: `tc-meter-bar` already
     transitions its own width, so the figure below stays an integer that
     steps once a second while the fill glides between the steps. Animating
     the number to match would make a value that changes every second flinch
     every second — `animate-tc-value` is for figures that arrive, and pages
     read is the only one of those on this screen. */
  const expectedMs = clamp(budget * MS_PER_PAGE, MIN_EXPECTED_MS, MAX_EXPECTED_MS);

  let progress = 0;
  if (phase === 'done') {
    progress = 100;
  } else if (phase === 'creating') {
    progress = ACCEPTED;
  } else if (phase === 'crawling') {
    const byTime = CREATED + (CEILING - CREATED) * clamp(elapsedMs / expectedMs, 0, 1);
    const byPages =
      pagesSeen === null
        ? 0
        : CREATED + (CEILING - CREATED) * clamp(pagesSeen / budget, 0, 1);
    progress = clamp(Math.round(Math.max(byTime, byPages)), CREATED, CEILING);
  }

  const finishCreation = (bot: any) => {
    if (!bot || completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    onComplete(bot);
  };

  /* ---- ported from createChatbot.tsx, lines 95-247 ---------------------- */
  const startRealTraining = async () => {
    try {
      if (!session) {
        setFailure({
          kind: 'create',
          title: 'You are signed out',
          body: 'Please sign in to create a chatbot. Nothing was created.',
        });
        setPhase('failed');
        return;
      }

      completionTriggeredRef.current = false;
      posthog.capture('chatbot_creation_started', {
        chatbot_name: name,
        website_url: site,
        crawl_limit: budget,
        user_id: (session?.user as any)?.id,
        user_email: session?.user?.email,
      });

      setFailure(null);
      setServerStatus('');
      setPagesSeen(null);
      lastLoggedPagesRef.current = 0;
      setElapsedMs(0);
      startedAtRef.current = Date.now();
      setPhase('creating');
      setLogs([{ text: 'Initializing Crawling engine...', timestamp: stamp() }]);

      const res = await fetch('/api/chatbot/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          website: site,
          limit: budget,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        let backendMessage = '';
        try {
          const parsed = JSON.parse(errorBody);
          backendMessage = parsed?.detail || parsed?.message || parsed?.error || '';
        } catch {
          backendMessage = errorBody;
        }

        if (res.status === 402) {
          posthog.capture('chatbot_creation_failed', {
            chatbot_name: name,
            error: 'Insufficient credits',
            stage: 'creation',
            user_id: (session?.user as any)?.id,
            user_email: session?.user?.email,
          });
          setFailure({
            kind: 'credits',
            title: 'Out of credits',
            body:
              backendMessage ||
              'Insufficient credits or free trials. Nothing was created and nothing was charged. Upgrade your plan to build this chatbot.',
          });
          setPhase('failed');
          return;
        }
        throw new Error(backendMessage || `Failed to create chatbot (HTTP ${res.status})`);
      }
      const newBot = await res.json();
      const botId = newBot.id;

      log('Bot created. Starting site crawl...');
      setPhase('crawling');

      // 2. Poll for status
      let attempts = 0;
      stopPoll();
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/chatbots');
          const chatbots = await statusRes.json();
          const currentBot = chatbots.find((b: any) => b.id === botId);

          if (!currentBot) return;

          if (currentBot.status === 'active') {
            clearInterval(pollInterval);
            pollRef.current = null;
            posthog.capture('chatbot_creation_completed', {
              chatbot_id: currentBot.id,
              chatbot_name: currentBot.name,
              pages_scraped: currentBot.pagesScraped,
              user_id: (session?.user as any)?.id,
              user_email: session?.user?.email,
            });
            log(`Success! Crawled ${currentBot.pagesScraped} pages.`);
            setServerStatus(currentBot.status);
            setPagesSeen(Number(currentBot.pagesScraped) || null);
            setCreatedBot(currentBot);
            setPhase('done');
          } else if (currentBot.status === 'error') {
            clearInterval(pollInterval);
            pollRef.current = null;
            const backendError =
              currentBot.trainingError ||
              'Error during crawling. No detailed error was returned by backend (likely old deployment or pending migration).';
            posthog.capture('chatbot_creation_failed', {
              chatbot_id: currentBot.id,
              chatbot_name: name,
              error: backendError,
              stage: 'training',
              user_id: (session?.user as any)?.id,
              user_email: session?.user?.email,
            });
            log(backendError);
            setServerStatus(currentBot.status);
            /* The bot exists — it is the crawl that failed. Kept so the CTA
               can hand the real record to the console instead of stranding it. */
            setCreatedBot(currentBot);
            setFailure({
              kind: 'training',
              title: 'The crawl did not finish',
              body: backendError,
            });
            setPhase('failed');
          } else {
            // Still training
            setServerStatus(String(currentBot.status ?? ''));
            /* A real page count if the backend sends one mid-crawl. It only
               ever moves forward, so a poll that omits it does not erase it. */
            const reported = Number(currentBot.pagesScraped);
            const grew = Number.isFinite(reported) && reported > lastLoggedPagesRef.current;
            if (grew) {
              lastLoggedPagesRef.current = reported;
              setPagesSeen((prev) => (prev === null ? reported : Math.max(prev, reported)));
              log(`Read ${exact(reported)} ${plural(reported, 'page')} so far.`);
            } else if (attempts % 5 === 0) {
              /* Names no vendor: which crawler we run is our business, and a
                 customer reading their own build log should not learn it. */
              log('Still reading the site...');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
      pollRef.current = pollInterval;
    } catch (error) {
      console.error('Failed to start training:', error);
      posthog.capture('chatbot_creation_failed', {
        chatbot_name: name,
        error: error instanceof Error ? error.message : String(error),
        stage: 'creation',
        user_id: (session?.user as any)?.id,
        user_email: session?.user?.email,
      });
      posthog.captureException(error);
      stopPoll();
      setFailure({
        kind: 'create',
        title: 'Could not create the chatbot',
        body: error instanceof Error ? error.message : 'Failed to create chatbot',
      });
      setPhase('failed');
    }
  };

  /* ---- 1 · ready ------------------------------------------------------- */
  if (phase === 'ready') {
    /* Read back only what was answered. A row with nothing behind it is left
       out rather than filled with a placeholder. */
    const summary: { label: string; value: React.ReactNode }[] = [
      { label: 'Site we will read', value: host || '—' },
      { label: 'Pages to read', value: `up to ${exact(budget)} ${plural(budget, 'page')}` },
      { label: 'Assistant name', value: name || '—' },
    ];
    if (purpose) summary.push({ label: 'Built for', value: purpose });
    if (tone) summary.push({ label: 'Answers in', value: tone });

    return (
      <div>
        <StepHeading
          title="Ready to build it"
          description="We fetch these pages, turn them into something it can search, and hand you a widget. It takes a minute or two and you can watch it happen."
        />
        <StepBody>
          <Panel>
            <PanelHeader
              eyebrow="/build"
              title="What happens next"
              action={<Mono>{`${exact(budget)} ${plural(budget, 'page')}`}</Mono>}
            />
            <PanelBody>
              {/* The read-back arrives in reading order. It is five answers the
                  reader gave over five screens, and seeing them land one after
                  another is what makes this feel like a confirmation rather
                  than a form they have to check. */}
              <KeyValue className="tc-stagger" items={summary} />
            </PanelBody>
            <PanelFooter className="justify-between">
              <button
                type="button"
                onClick={onBack}
                className="tc-path inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Lineicons icon={ArrowLeftOutlined} className="size-3.5" aria-hidden="true" />
                Back
              </button>
              {/* One ring pulse, and only when the button can actually be
                  pressed. `tc-ready` is the answer to "what changed?", and what
                  changed is that five questions are behind them and this is the
                  only thing left to do. A loop here would be an advertisement. */}
              <Button
                onClick={startRealTraining}
                disabled={!host || !name}
                className={cn(host && name && 'animate-tc-ready')}
              >
                <Lineicons icon={Rocket5Outlined} className="size-4" aria-hidden="true" />
                Build my assistant
              </Button>
            </PanelFooter>
          </Panel>
          <p className="tc-path text-muted-foreground">
            Only the site, the name and the page budget are sent to the crawler. The rest of your
            answers stay on this device and shape what we show you next.
          </p>
        </StepBody>
      </div>
    );
  }

  /* ---- 3 · done -------------------------------------------------------- */
  if (phase === 'done') {
    /* Every row below is a field of the create/poll response. `pagesScraped`
       is the only page figure that exists; when the backend does not send it
       the row is dropped, because the previous wizard printed a literal 23
       here while the real number sat unused. No model name: nothing in the
       response says which model answered. No percentage: it is done. */
    const pages = Number(createdBot?.pagesScraped);
    const readPages = Number.isFinite(pages) && pages > 0 ? pages : null;
    const botName = String(createdBot?.name ?? name ?? '').trim();
    const botHost = hostOf(String(createdBot?.website ?? draft.website ?? ''));

    const facts: { label: string; value: React.ReactNode }[] = [];
    if (readPages !== null) facts.push({ label: 'pages read', value: exact(readPages) });
    if (botHost) facts.push({ label: 'source', value: botHost });
    if (createdBot?.status) facts.push({ label: 'status', value: String(createdBot.status) });

    return (
      <div>
        <StepBody className="mt-0">
          <Panel className="border-success-border">
            <PanelBody className="space-y-6 py-10 text-center">
              {/* The seal is outside the stagger below on purpose: `tc-stagger`
                  sets `tc-rise` on every direct child, which would win over
                  `tc-pop` and flatten the one moment on this screen that is
                  allowed to overshoot. The tick inside it is a grandchild, so
                  it keeps its own spring and lands inside the pop. */}
              <span className="animate-tc-pop mx-auto flex size-12 items-center justify-center rounded-full border border-success-border bg-success-soft">
                <Lineicons
                  icon={CheckOutlined}
                  className="animate-tc-tick size-5 text-success-ink"
                  aria-hidden="true"
                />
              </span>
              <div className="tc-stagger space-y-6">
                <div className="space-y-2">
                  <h1 className="tc-display text-[1.5rem] leading-[1.18] text-foreground sm:text-[1.75rem]">
                    {botName ? `${botName} is ready` : 'Your assistant is ready'}
                  </h1>
                  <p className="mx-auto max-w-md tc-body text-muted-foreground">
                    It has read your site and answers only from what it found there. Next: ask it
                    something, then put it on your pages.
                  </p>
                </div>

                {facts.length > 0 ? (
                  <dl className="tc-stagger mx-auto grid max-w-md gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                    {facts.map((fact) => (
                      <div key={fact.label} className="bg-card px-4 py-3 text-left">
                        <dt className="tc-eyebrow">{fact.label}</dt>
                        <dd className="tc-num mt-1 truncate font-mono text-[0.9375rem] text-foreground">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <div>
                  {/* Arriving last, and pulsing once as it does: the console is
                      the thing that just became openable. Still a click — the
                      payoff is only a payoff if somebody reads it. */}
                  <Button className="animate-tc-ready" onClick={() => finishCreation(createdBot)}>
                    Open the console
                    <Lineicons icon={ArrowRightOutlined} className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <LogHistory logs={logs} />
        </StepBody>
      </div>
    );
  }

  /* ---- 2 · building, and the failure that can interrupt it -------------- */
  const stage = stageIndex(serverStatus);
  const stages = stageStates(phase, serverStatus);
  const crawlLive = stages[1] === 'live';
  /* Driven by the clock that was already running for the bar, so a rotating
     line costs no second timer — and it is CSS that animates the swap, so
     `prefers-reduced-motion` neutralises it without this file checking. */
  const waitIndex = Math.floor(elapsedMs / WAIT_LINE_MS) % WAIT_LINES.length;
  const headline =
    phase === 'creating'
      ? 'Handing your site to the crawler'
      : statusSentence(serverStatus) ??
        (serverStatus
          ? `The crawler reports: ${serverStatus}.`
          : 'Fetching pages and following the links it finds.');

  return (
    <div>
      <StepHeading
        title={phase === 'failed' ? 'That did not work' : `Reading ${host || 'your site'}`}
        description={
          phase === 'failed'
            ? /* A failed crawl is not a failed build: the record exists, and
                 the old copy said "nothing is half-built" to a reader looking
                 at a bot that very much was. The two cases now read
                 differently because they are different. */
              failure?.kind === 'training'
              ? 'The chatbot exists — it is the reading of your site that stopped. What came back is below, and it is yours to point somewhere else.'
              : 'Nothing is half-built. Read what went wrong below, then either try again or change the plan.'
            : 'Leave this open and watch, or come back later — the crawl keeps going either way.'
        }
      />

      <StepBody>
        {failure ? (
          <div className="animate-tc-rise space-y-4">
            <ErrorState
              title={failure.title}
              body={failure.body}
              /* Only a failed create is retryable here. A 402 fails identically
                 against the same empty balance, and a failed crawl already left
                 a bot on the account — re-firing create there would quietly make
                 a second one. Both get their own action below instead. */
              onRetry={failure.kind === 'create' ? () => void startRealTraining() : undefined}
            />

            {/* The second half of a failure, and the half that is usually
                missing: what survived it. Every value here is one the reader
                typed or the server returned, so a dead end turns back into a
                position — you still have the site, the budget, the name, and
                on a crawl failure the record and however far it got. */}
            <div className="space-y-2">
              <p className="tc-eyebrow text-center">still true</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                <Fact label="site" value={host || '—'} />
                <Fact label="budget" value={`${exact(budget)} ${plural(budget, 'page')}`} />
                <Fact label="name" value={name || '—'} />
                {pagesSeen !== null ? (
                  <Fact label="pages read" value={exact(pagesSeen)} tone="signal" />
                ) : null}
                {createdBot?.status ? <StatusPill status={createdBot.status} /> : null}
              </div>
            </div>

            {failure.kind === 'credits' ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild variant="plate">
                  <Link href="/pricing">
                    See plans
                    <Lineicons icon={ArrowRightOutlined} className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={onBack}>
                  <Lineicons icon={ArrowLeftOutlined} className="size-4" aria-hidden="true" />
                  Change the plan
                </Button>
              </div>
            ) : null}

            {/* A create that never returned leaves the answers intact, so the
                way out is the same door they came in by. Offered beside the
                retry rather than instead of it: retrying the same request is
                the likelier fix for a network blip. */}
            {failure.kind === 'create' ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" onClick={onBack}>
                  <Lineicons icon={ArrowLeftOutlined} className="size-4" aria-hidden="true" />
                  Change the plan
                </Button>
                <span className="tc-meta text-muted-foreground">
                  Try again above, or go back and change the site or the page budget.
                </span>
              </div>
            ) : null}

            {failure.kind === 'training' ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* No `tc-ready` pulse here, unlike the success screen: this
                    button is the way out of a failure, not a reward, and a ring
                    expanding out of it on a panel with a danger border reads as
                    celebration. */}
                <Button onClick={() => finishCreation(createdBot)} disabled={!createdBot}>
                  Open the console
                  <Lineicons icon={ArrowRightOutlined} className="size-4" aria-hidden="true" />
                </Button>
                <span className="tc-meta text-muted-foreground">
                  {createdBot?.name ? `${createdBot.name} exists` : 'The chatbot exists'} — you can point
                  it at different pages and read it again from its training page.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase !== 'failed' ? (
          <Panel>
            <PanelHeader
              eyebrow="/crawl"
              title={headline}
              description={`Step ${stage + 1} of ${STAGES.length} · ${STAGES[stage]}`}
              /* The server's own word once there is one. `LiveTag` covers the
                 gap before the first poll answers, where there is no word to
                 show and the only honest claim is "working". Keyed so a status
                 change arrives rather than mutating in place. */
              action={
                serverStatus ? (
                  <span key={serverStatus} className="animate-tc-value inline-flex">
                    <StatusPill status={serverStatus} />
                  </span>
                ) : (
                  <LiveTag label="working" />
                )
              }
            />
            <PanelBody className="space-y-5">
              {/* The sequence first, the estimate second. A percentage on top
                  is what made this read as a spinner: it answers "how long"
                  and leaves "what is it doing" to the imagination. */}
              <StageRail states={stages} />

              {/* The bar plus the one number it is allowed to claim. It is
                  labelled `progress`, not `pages`: pages are the mono fact
                  below and come only from the poll. */}
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="tc-eyebrow">progress</span>
                  <Mono>{`${progress}%`}</Mono>
                </div>
                <span
                  className="tc-meter mt-2 h-1.5"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Crawl progress"
                  style={{ ['--tc-fill' as any]: `${progress}%` }}
                >
                  {/* The glide between two values is `tc-meter-bar`'s own width
                      transition, in the stylesheet. Nothing is added here: a
                      second transition on the same property is how a bar ends
                      up lurching. */}
                  <span className="tc-meter-bar" />
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <Fact label="host" value={host || '—'} />
                <Fact label="budget" value={`${exact(budget)} ${plural(budget, 'page')}`} />
                <Fact
                  label="pages read"
                  /* Keyed by the count so the figure re-enters when it grows.
                     Without the key React patches the text node in place and a
                     number that took twelve seconds to earn changes with no
                     reading of change at all. `not reported yet` is kept rather
                     than dropping the row: the row appearing later would move
                     everything beside it. */
                  value={
                    <span key={pagesSeen ?? 'none'} className="animate-tc-value inline-block">
                      {pagesSeen === null ? 'not reported yet' : exact(pagesSeen)}
                    </span>
                  }
                  tone={pagesSeen === null ? 'quiet' : 'signal'}
                />
                <Fact label="elapsed" value={mmss(elapsedMs)} />
              </div>
            </PanelBody>

            <div className="border-t border-border">
              <div className="flex items-center justify-between px-5 py-2.5 sm:px-6">
                <span className="tc-eyebrow">crawl log</span>
                {/* The same pairing the playground uses while it retrieves: a
                    moving texture means bytes are coming off their site now,
                    which the meter's three-second steps cannot show. It is tied
                    to the crawl stage being live, because during the create
                    call and while the job is queued nothing is being fetched
                    and a moving strip would say otherwise. */}
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn('h-1 w-16 rounded-full', crawlLive ? 'tc-crawl' : 'bg-border')}
                  />
                  <span className="tc-eyebrow">{crawlLive ? 'fetching' : 'standing by'}</span>
                </span>
              </div>
              {/* The well scrolls itself, and `aria-live="polite"` reads the
                  newest line without stealing focus from anything. */}
              <div
                ref={logRef}
                aria-live="polite"
                className="tc-well max-h-56 overflow-y-auto border-t border-border bg-surface-2 px-5 py-3.5 sm:px-6"
              >
                <ol className="space-y-1.5 tc-micro leading-5">
                  {logs.map((line, i) => (
                    <li
                      key={`${line.timestamp}-${i}`}
                      className="animate-tc-rise flex gap-3"
                    >
                      <span className="tc-num shrink-0 text-muted-foreground">
                        {line.timestamp}
                      </span>
                      <span className="min-w-0 text-foreground">{line.text}</span>
                    </li>
                  ))}
                  {/* The standing line. `min-h-5` and `truncate` are the whole
                      trick: the phrase changes but the row cannot change size,
                      so a rotation two lines above the fold does not shunt the
                      log. `aria-hidden` because this is reassurance for a
                      reader watching, and the live region above already
                      announces the lines that carry news — a sentence
                      rewriting itself every nine seconds is not news. */}
                  <li
                    aria-hidden="true"
                    className="flex min-h-5 items-center gap-2 text-muted-foreground"
                  >
                    <Lineicons
                      icon={Spinner3Outlined}
                      className="size-3 shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <span key={waitIndex} className="animate-tc-value min-w-0 truncate">
                      {WAIT_LINES[waitIndex]}
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            <PanelFooter>
              <span className="flex items-center gap-2 tc-meta text-muted-foreground">
                <Lineicons
                  icon={Globe1Outlined}
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                Most first crawls finish in a couple of minutes. Closing this page does not stop it.
              </span>
            </PanelFooter>
          </Panel>
        ) : (
          <LogHistory logs={logs} />
        )}
      </StepBody>
    </div>
  );
}
