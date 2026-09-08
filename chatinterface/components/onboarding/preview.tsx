'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { Globe1Outlined, Message2Outlined } from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { hostOf, type Draft } from '@/lib/onboarding';
import {
  Bone,
  Hairline,
  KeyValue,
  Mono,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
} from '@/components/dashboard/kit';

/* ==========================================================================
   First run  ·  the agent taking shape
   --------------------------------------------------------------------------
   The rail beside every question. Its job is to turn six answers into a thing
   the customer can see, so the flow reads as being walked toward a first
   outcome rather than as a form with a submit button at the end.

   It reads `draft` and nothing else: no fetch, no derived claim, no number
   the answers did not contain. The single exception is the sample exchange at
   the bottom, which is invented and says so in the label — it exists because
   “brief” and “formal” are words until you have seen the difference.

   Movement is the whole argument here, so it is decided once, at the top:

   · A fact that lands is *seen* to land. Nothing else in the rail moves at
     the same time, so the entrance is unambiguous — that value, just now.
   · Nothing announces itself on open. A draft restored from localStorage
     would otherwise play six entrances at once, which reads as a page
     loading rather than as an answer arriving.
   · The reply types. It is the only place in the flow where the reader can
     watch a word they picked ("Brief") become the thing it describes.
   · Nothing the rail does may move the question column, and the panel keeps
     its width as content arrives. A preview that shoves the field you are
     typing in is worse than no preview.

   Deliberately rejected: the testimonial rail from the reference screenshots.
   A saturated blue panel of customer logos beside a half-finished form is
   persuasion aimed at somebody who has already bought. This rail is product.
   ========================================================================== */

const PURPOSE_LABEL: Record<string, string> = {
  support: 'Customer support',
  presales: 'Pre-sales questions',
  docs: 'Docs and developer Q&A',
  internal: 'Internal lookups',
  onboarding: 'Onboarding new users',
};

const TONE_LABEL: Record<string, string> = {
  plain: 'Plain',
  warm: 'Warm',
  brief: 'Brief',
  formal: 'Formal',
};

const CHANNEL_LABEL: Record<string, string> = {
  widget: 'Website widget',
  'hosted-page': 'Hosted page',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  discord: 'Discord',
  'ios-sdk': 'iOS SDK',
  wordpress: 'WordPress',
  webhook: 'Webhook',
  instagram: 'Instagram',
  email: 'Email',
  phone: 'Phone',
};

/* One sample per purpose, rewritten per tone. Twenty short strings rather
   than one string with adjectives swapped, because the difference between
   "Brief" and "Formal" is sentence structure, and a customer picking between
   them has to be able to see it. The question is the one the purpose's own
   card quotes, so the two screens agree. */
type Sample = { question: string; answers: Record<string, string> };

const SAMPLES: Record<string, Sample> = {
  support: {
    question: 'How do I cancel my plan?',
    answers: {
      plain:
        'Open Settings, then Billing, and choose Cancel plan. It stays active until the end of the period you have paid for.',
      warm:
        'Happy to help with that — Settings, then Billing, then Cancel plan. You keep access until the end of the period you have already paid for.',
      brief: 'Settings, then Billing, then Cancel plan. Access runs to the end of the paid period.',
      formal:
        'Certainly. Cancellation is available under Settings, then Billing. Access continues until the conclusion of the current billing period.',
    },
  },
  presales: {
    question: 'Does it work with Postgres?',
    answers: {
      plain: 'Yes. Postgres 13 and above, over a standard connection string.',
      warm:
        'It does — Postgres 13 and up, using a normal connection string. Nothing special to configure.',
      brief: 'Yes. Postgres 13+.',
      formal:
        'Yes. Postgres version 13 and later are supported, using a standard connection string.',
    },
  },
  docs: {
    question: 'Which endpoint returns usage?',
    answers: {
      plain: 'GET /v1/usage. It takes a from and to date and returns per-day totals.',
      warm:
        'That one is GET /v1/usage — pass a from and to date and you get per-day totals back.',
      brief: 'GET /v1/usage, with from and to dates.',
      formal:
        'Usage figures are returned by GET /v1/usage, which accepts a from and to date and responds with per-day totals.',
    },
  },
  internal: {
    question: 'Where is the deploy runbook?',
    answers: {
      plain: 'It is on the Engineering handbook page, under Release. Staging steps are at the top.',
      warm:
        'It lives on the Engineering handbook page under Release — staging steps first, then production.',
      brief: 'Engineering handbook, Release section.',
      formal:
        'The deployment runbook is documented on the Engineering handbook page, within the Release section.',
    },
  },
  onboarding: {
    question: 'Where do I start?',
    answers: {
      plain: 'Connect a source first, then invite your team. Both take about a minute.',
      warm:
        'Start by connecting a source — after that, invite your team. Neither takes more than a minute.',
      brief: 'Connect a source, then invite your team.',
      formal:
        'We recommend connecting a source first, then inviting your team. Each step takes approximately one minute.',
    },
  },
};

const FALLBACK: Sample = {
  question: 'How much does it cost, and is there a free plan?',
  answers: {
    plain: 'There is a free plan, and paid plans start at $19 a month. Pricing has the full table.',
    warm:
      'There is a free plan to start on, and paid plans begin at $19 a month — the Pricing page has the full breakdown.',
    brief: 'Free plan, then $19 a month.',
    formal:
      'A free plan is available, and paid plans begin at $19 per month. Full details are listed on the Pricing page.',
  },
};

function sampleFor(draft: Draft): { question: string; answer: string } {
  const sample = SAMPLES[draft.purpose ?? ''] ?? FALLBACK;
  const tone = draft.tone ?? 'plain';
  return { question: sample.question, answer: sample.answers[tone] ?? sample.answers.plain };
}

/* A value that has not been answered yet. A bone rather than an em dash for
   the two identity fields, because the point of the empty state is to show
   that something is coming — an em dash reads as "there will never be one". */
function Pending({ width }: { width: string }) {
  return <Bone className={cn('inline-block h-2.5', width)} />;
}

/* --------------------------------------------------------------------------
   Values that arrive
   --------------------------------------------------------------------------
   `animate-tc-value` is a keyframe rather than a transition because there is
   no property to tween between two different strings, and a keyframe only
   plays on a fresh element. So the trigger is a remount, keyed on whatever
   counts as a change for that particular fact — and the fact that a value was
   already there when the rail opened is what has to be remembered, otherwise
   a restored draft animates six things at once on load.
   -------------------------------------------------------------------------- */

/** Reduced motion, read where it matters. The typewriter below is driven from
 *  JS, so the media query in globals.css cannot neutralise it for us. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** One fact, animated only when it changes under the reader.
 *
 *  `trigger` is not always the value itself. Picked answers — purpose, tone,
 *  the page budget — key on their content, so every new answer arrives. Typed
 *  answers key on presence alone: the address is re-parsed on every keystroke
 *  and the name is rewritten from it by `suggestName`, so keying those on
 *  content would fire the entrance once per character, which is a strobe and
 *  not a value landing. */
function Landed({
  trigger,
  className,
  children,
}: {
  trigger: string;
  className?: string;
  children: ReactNode;
}) {
  /* Frozen at this component's own mount — which is why the wrapper has to sit
     outside the answered/pending branch rather than inside it. A `Landed` that
     first mounts together with its own real value has nothing to compare
     against, and would announce a saved draft as if it had just been typed. */
  const opened = useRef(trigger);

  return (
    <span
      key={trigger}
      className={cn(
        'inline-block max-w-full',
        trigger !== opened.current && 'animate-tc-value',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A chosen channel, summarised. Quiet on purpose: `signal` means selection
 *  and live in this system, and the question column is already spending it on
 *  the chips the reader is pressing. Wearing it here would make a read-only
 *  summary look pressable. */
function ChannelPill({ label, arriving }: { label: string; arriving: boolean }) {
  /* The same freeze as `Landed`, moved into the pill because these are a list:
     keying the row on the joined ids would re-announce every channel each time
     one more is picked, and "Slack" did not change when "Email" was added. */
  const enter = useRef(arriving);

  return (
    <span
      className={cn(
        'tc-eyebrow inline-flex max-w-full items-center rounded-full border border-border bg-surface-2 px-2 py-0.5',
        enter.current && 'animate-tc-value',
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

/** The channels there was no room to name. Bare text rather than a fourth
 *  pill, so it reads as a count of the list and not as another channel.
 *
 *  It needs both halves of the trick: the freeze, because the node first
 *  appears in the middle of the flow and `Landed` alone cannot tell that from
 *  a restored draft, and the `key`, because +1 becoming +2 changes only text
 *  and text alone never restarts a keyframe. */
function ChannelOverflow({
  count,
  names,
  arriving,
}: {
  count: number;
  names: string;
  arriving: boolean;
}) {
  const enter = useRef(arriving);

  return (
    <span
      key={count}
      className={cn('tc-eyebrow inline-block', enter.current && 'animate-tc-value')}
    >
      <span aria-hidden="true">{`+${count}`}</span>
      {/* A count is enough to see; a screen reader gets the names, because
          "+2" tells it nothing it can act on. */}
      <span className="sr-only">{`and ${count} more: ${names}`}</span>
    </span>
  );
}

/* The reply types itself, and the budget is fixed rather than the delay per
   character: the formal answers are three times the length of the brief ones,
   and waiting three times as long to read one would punish the very tone the
   reader has just chosen. Long replies type faster, they do not take longer. */
const TYPE_TICK_MS = 22;
const TYPE_BUDGET_MS = 880;

function SampleReply({ answer }: { answer: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    /* Straight to the end, no caret: an animation driven from JS is invisible
       to the `prefers-reduced-motion` block in globals.css. */
    if (prefersReducedMotion()) {
      setShown(answer.length);
      return;
    }

    const ticks = Math.max(1, Math.round(TYPE_BUDGET_MS / TYPE_TICK_MS));
    const step = Math.max(1, Math.ceil(answer.length / ticks));

    /* The cut lives in the closure, not in state: the interval has to know
       where it got to without waiting for a render, and this rail re-renders
       on every keystroke in the name field. The cleanup is what keeps that
       cheap — one timer at a time, cancelled on unmount, and a retype is an
       unmount (see the `key` at the call site). */
    let cut = 0;
    const timer = window.setInterval(() => {
      cut = Math.min(answer.length, cut + step);
      setShown(cut);
      if (cut >= answer.length) window.clearInterval(timer);
    }, TYPE_TICK_MS);

    return () => window.clearInterval(timer);
  }, [answer]);

  const typing = shown < answer.length;

  return (
    <div className="flex justify-start">
      {/* Two copies of the reply in one grid cell, and this is the whole answer
          to the jitter: the finished reply is drawn at zero opacity and sizes
          the bubble, the typed prefix is painted over it. The bubble is
          therefore its final height *and* width from the first frame, at any
          panel width and in any font, with no measuring pass and no
          min-height guess. Line breaking is greedy, so the prefix wraps
          exactly where the finished text does — no word jumps a line as it
          types, and the rail never moves.

          `opacity-0` rather than `invisible`, because a visibility-hidden node
          leaves the accessibility tree: this copy is the one a screen reader
          should read, whole and at once, so the typed copy below it is
          decoration and says so. `select-none` keeps a selection of the reply
          from picking up both. */}
      <p className="grid max-w-[92%] rounded-2xl rounded-bl-md border border-signal-border bg-signal-soft px-3.5 py-2.5 tc-body text-signal-ink">
        <span className="col-start-1 row-start-1 select-none opacity-0">{answer}</span>
        <span aria-hidden="true" className="col-start-1 row-start-1">
          {answer.slice(0, shown)}
          {typing ? (
            /* Net advance width zero — `ml-0.5` plus `w-[2px]` cancelled by
               `-mr-1` — so the caret can never push the last word onto a new
               line and undo the height the copy underneath just reserved. */
            <span className="animate-blink-cursor -mr-1 ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-signal-ink align-middle" />
          ) : null}
        </span>
      </p>
    </div>
  );
}

/* Five facts, because those are the five the rail can draw. The page budget is
   deliberately not one of them: it arrives with a default, so counting it would
   open the reader at one of six for a question they have not read yet. */
const FACT_TOTAL = 5;

/** How many channels are named before the rest become a `+N`. */
const CHANNEL_PILLS = 3;

/* What the rail has, as a count and not a bar. The frame owns the only
   progress in this flow; a second bar beside it would be two answers to "how
   far along am I?" and they would disagree, because that one counts screens
   and this one counts answers. Text cannot be mistaken for the other thing —
   and never the marker, which means "cited from here". */
function AnswerCount({ filled }: { filled: number }) {
  return (
    <span className="tc-eyebrow shrink-0">
      <span className="sr-only">{`${filled} of ${FACT_TOTAL} answers in.`}</span>
      <span aria-hidden="true">
        <Landed trigger={String(filled)} className="tc-num text-foreground">
          {filled}
        </Landed>
        {`/${FACT_TOTAL} answered`}
      </span>
    </span>
  );
}

export function AgentPreview({ draft }: { draft: Draft }) {
  const host = hostOf(draft.website);
  const name = draft.agentName.trim();
  const purpose = draft.purpose ? PURPOSE_LABEL[draft.purpose] ?? draft.purpose : null;
  const tone = draft.tone ? TONE_LABEL[draft.tone] ?? draft.tone : null;
  const channels = draft.channels
    .map((id) => ({ id, label: CHANNEL_LABEL[id] ?? id }))
    .filter((channel) => Boolean(channel.label));

  const sample = sampleFor(draft);
  const answered = Boolean(purpose || host || name || tone);
  const filled = [purpose, host, name, tone, channels.length > 0].filter(Boolean).length;

  /* False for the first render only, so a channel restored from a saved draft
     is drawn while one picked a moment ago arrives. A ref rather than state
     because it is read while rendering the pills and flipping it must not
     itself cause a render; the cleanup resets it because a remount is a fresh
     open, which is exactly what React's development double-mount simulates. */
  const opened = useRef(false);
  useEffect(() => {
    opened.current = true;
    return () => {
      opened.current = false;
    };
  }, []);

  const named = channels.slice(0, CHANNEL_PILLS);
  const rest = channels.slice(CHANNEL_PILLS);

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        className="pt-4 pb-3 lg:pt-5 lg:pb-4"
        eyebrow="/preview"
        action={<AnswerCount filled={filled} />}
        title={
          /* The name is the identity, so it is the one field that gets a
             skeleton in the heading slot rather than being hidden. Presence is
             the trigger, not the text: `suggestName` rewrites this from the
             host while the address is still being typed. */
          <Landed trigger={name ? 'named' : 'pending'} className="block truncate">
            {name ? (
              name
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Pending width="w-32" />
              </span>
            )}
          </Landed>
        }
        description={
          <Landed trigger={host ? 'reading' : 'pending'} className="block">
            {host ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <Lineicons
                  icon={Globe1Outlined}
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                  focusable="false"
                />
                <Mono className="truncate">{host}</Mono>
              </span>
            ) : (
              'Answer the questions and this fills in.'
            )}
          </Landed>
        }
      />

      <PanelBody
        className={cn(
          /* One stagger, on first appearance: the facts, the rule and the
             sample arrive in reading order rather than as one block. */
          'tc-stagger space-y-3 pb-4 lg:space-y-4 lg:pb-5',
          /* Below `lg` this rail sits under the question, where a preview with
             nothing in it is a screenful of dead weight between the answer and
             the Continue button. Until it has something to say it is a header
             and a footer; from `lg` it is always the whole rail. Collapsing the
             body rather than writing a shorter phone version keeps one visual
             language — there is no second summary to keep in step with this
             one — and `display` is also what replays the stagger, so the rail
             is seen to wake up on the answer that fills it. */
          !answered && 'hidden lg:block',
        )}
      >
        <div>
          <KeyValue
            items={[
              {
                label: 'Answers',
                value: (
                  <Landed trigger={purpose ?? 'pending'} className="truncate">
                    {purpose ?? <Pending width="w-24" />}
                  </Landed>
                ),
                mono: false,
              },
              {
                label: 'Pages on first read',
                value: (
                  <Landed trigger={String(draft.crawlLimit || 'pending')} className="tc-num">
                    {draft.crawlLimit ? draft.crawlLimit : <Pending width="w-8" />}
                  </Landed>
                ),
              },
              {
                label: 'Tone',
                value: (
                  <Landed trigger={tone ?? 'pending'}>{tone ?? <Pending width="w-16" />}</Landed>
                ),
                mono: false,
              },
            ]}
          />

          {/* Channels are a set, so they are drawn as one. Deliberately not a
              `KeyValue` row: that value cell truncates on a single line, and
              three names plus an overflow count get cut off at panel width —
              losing the `+N`, which is the one part that says the list is
              longer than it looks. Wrapping drops the pills onto their own
              line instead, still right-aligned, so the row rhythm survives on
              a phone. The top border continues the `divide-y` above it. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 border-t border-border py-2.5">
            <span className="shrink-0 tc-meta text-muted-foreground">
              Answers on
            </span>
            {channels.length > 0 ? (
              /* Content-sized rather than `flex-1`: a flex item whose base size
                 overflows the row wraps onto the next line, where `ml-auto`
                 keeps it right-aligned with the values above it. A zeroed basis
                 would instead squeeze the pills into a narrow column beside the
                 label and stack them there. */
              <span className="ml-auto flex flex-wrap items-center justify-end gap-1">
                {named.map((channel) => (
                  <ChannelPill key={channel.id} label={channel.label} arriving={opened.current} />
                ))}
                {rest.length > 0 ? (
                  <ChannelOverflow
                    count={rest.length}
                    names={rest.map((channel) => channel.label).join(', ')}
                    arriving={opened.current}
                  />
                ) : null}
              </span>
            ) : (
              <Pending width="w-28" />
            )}
          </div>
        </div>

        <Hairline />

        {/* The invented part, and the only part. Labelled before it is read,
            because the whole promise of the product is that answers come out of
            the customer's own pages — a convincing sample that did not say so
            would be the one lie in the flow. */}
        <div className="space-y-2 lg:space-y-2.5">
          <p className="tc-eyebrow flex items-center gap-1.5">
            <Lineicons
              icon={Message2Outlined}
              className="size-3.5"
              aria-hidden="true"
              focusable="false"
            />
            Sample · not from your site
          </p>

          <div className="space-y-2">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-surface-2 px-3.5 py-2.5 tc-body text-foreground">
                {/* The question is the one the purpose's own card quotes, so it
                    changes when the purpose does — and it has to be seen to,
                    or the reply underneath looks like an answer to the last
                    question rather than to this one. */}
                <Landed trigger={sample.question}>{sample.question}</Landed>
              </p>
            </div>

            {/* Bones until an answer has been given: an invented reply sitting
                there before the first question is answered reads as the product
                claiming to know something it has not been told. */}
            {answered ? (
              /* The `key` is the retype. A new tone resolves to a different
                 string, the old instance unmounts and takes its interval with
                 it, and the new one starts from nothing — no mid-flight count
                 to reconcile, and no frame showing the new reply in full before
                 it begins to type. */
              <SampleReply key={sample.answer} answer={sample.answer} />
            ) : (
              <div className="space-y-1.5 rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2.5">
                <Bone className="h-2.5 w-full" />
                <Bone className="h-2.5 w-4/5" />
              </div>
            )}
          </div>
        </div>
      </PanelBody>

      <PanelFooter>
        {/* Two states, and the line is the only place the rail says which one
            it is in — so the change is animated for the same reason a value is:
            it is a fact about the draft that just became true. */}
        <p className="tc-path text-muted-foreground">
          <Landed trigger={answered ? 'drafted' : 'empty'}>
            {answered ? 'Nothing is created until the last step.' : 'Nothing here is saved yet.'}
          </Landed>
        </p>
      </PanelFooter>
    </Panel>
  );
}
