'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Bone, Kbd, PanelSkeleton } from '@/components/dashboard/kit';

/* ==========================================================================
   First run  ·  the chrome around every step
   --------------------------------------------------------------------------
   A sibling of the dashboard shell, not a copy of it. The shell's job is to
   tell you where you can go; this frame's job is to make sure there is only
   one thing to do. So it has no sidebar, no bot switcher, no command palette
   and no theme toggle: six screens, one question each, and a rail that shows
   what the answers are building.

   Deliberately rejected:
     · A filled progress bar. It turns six questions into a loading screen,
       and it lies about effort — step 2 is not "33% of the work".
     · Numbered dots. Every onboarding wizard on the internet has them, and
       they read as a control the reader can click when they cannot.
     · Absolute centring. Vertically centred with `position` clips the
       question on a 640px-tall laptop; a min-height plus normal flow does
       not, and gives the same result on a tall screen.
     · Progress the reader can click *forward*. Backwards is a correction and
       costs nothing; forwards lands on a question whose answer the screen
       before it has not produced yet, so those steps are not controls.
     · An `aria-live` announcement of the new step *and* moving focus into it.
       Together they read the step's name twice. Focus alone puts the reader
       at the top of the new question with Tab pointing into its first field,
       which is the thing they actually needed.
   ========================================================================== */

/** Which way the flow just moved. The step's entrance is direction-aware. */
export type StepDirection = 'forward' | 'back';

/* The chrome's fixed measures, named once rather than typed twice: the
   skeleton at the bottom of this file stands in for the real frame while the
   session resolves, and a loading state whose header is a different height is
   a layout jump the moment it swaps. */
const SHELL = 'flex min-h-screen flex-col bg-background text-foreground';
const HEAD_ROW = 'mx-auto flex h-14 w-full max-w-[74rem] items-center gap-4 px-4 sm:px-6 lg:px-8';
const MAIN_PAD =
  'flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12';
const CENTRE = 'm-auto w-full max-w-[74rem]';
const COLUMNS = 'grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]';

/** The wordmark. Copied from the console header so the two never drift. */
export function OnboardingBrand() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-display text-[1.0625rem] font-medium tracking-[-0.03em] text-foreground">
        turbochat
      </span>
      <span className="size-1 rounded-full bg-marker-deep" aria-hidden="true" />
    </span>
  );
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

type SegmentState = 'done' | 'current' | 'pending';

/* Progress, read rather than watched: a mono count and a run of hairline
   segments. Three states, and none of them are colour alone — done is a
   filled hairline, the current one is wider and twice as thick, pending is
   the bare track. Never the marker: that yellow means "cited from here".

   It was one `role="progressbar"` until the completed steps became clickable,
   which is the one thing a progressbar cannot hold: ARIA treats its children
   as presentational, so buttons inside it are announced as nothing at all. A
   labelled list, with `aria-current` on the step you are on, is the reading
   that survives having controls in it — and the mono count beside it still
   carries the "3 of 6" the progressbar was there for. */
function StepProgress({
  index,
  total,
  stepLabel,
  stepLabels,
  onJump,
}: {
  index: number;
  total: number;
  stepLabel: string;
  stepLabels?: readonly string[];
  onJump?: (position: number) => void;
}) {
  /* The segment the reader has only just crossed, which is the only one that
     should draw itself in. Deliberately not remembered per step: the class
     comes off again the moment that segment stops being the one behind the
     cursor, and that is what lets a back-and-forth replay the fill instead of
     leaving a spent animation attached to it. */
  const [filled, setFilled] = useState<number | null>(null);
  const crossedRef = useRef(index);

  useEffect(() => {
    const previous = crossedRef.current;
    crossedRef.current = index;
    /* Only a forward move fills something. Arriving at step 4 from a URL is
       not four crossings, and animating three segments at once on load reads
       as the page still loading. */
    if (index > previous) setFilled(index - 1);
  }, [index]);

  function nameFor(position: number, state: SegmentState): string {
    const label = stepLabels?.[position];
    const where = `Step ${position + 1} of ${total}${label ? `: ${label}` : ''}`;
    if (state === 'current') return `${where}, current step`;
    if (state === 'done') {
      return onJump ? `${where}, completed — go back to it` : `${where}, completed`;
    }
    return `${where}, not yet reached`;
  }

  return (
    <div className="flex items-center gap-3">
      {/* The count and the segments are two readings of the same fact, so the
          list below owns the semantics and this is decoration. */}
      <span aria-hidden="true" className="tc-eyebrow shrink-0">
        <span key={index} className="tc-num animate-tc-value inline-block text-foreground">
          {pad(index + 1)}
        </span>
        <span className="px-1">/</span>
        <span className="tc-num">{pad(total)}</span>
      </span>

      <ol aria-label="Setup steps" className="flex items-center">
        {Array.from({ length: total }, (_, position) => {
          const state: SegmentState =
            position < index ? 'done' : position === index ? 'current' : 'pending';
          /* A completed step is a correction the reader is allowed to make. An
             unreached one is not a control at all, so it is text, not a
             disabled button nobody can do anything with. */
          const reachable = state === 'done' && !!onJump;

          /* Every segment is the same track-and-fill pair in all three states,
             so advancing is a width change on nodes that stay put rather than a
             remount. That is what lets the just-crossed segment animate at all:
             React adds `animate-tc-progress` to a fill already on screen, and
             the class change is what starts it. */
          const bar = (
            <span
              aria-hidden="true"
              className={cn(
                'block overflow-hidden rounded-full bg-border-strong',
                'transition-[width,height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
                state === 'current' ? 'h-0.5 w-6' : 'h-px w-3',
                reachable && 'group-hover:h-0.5 group-focus-visible:h-0.5',
              )}
            >
              <span
                className={cn(
                  'block h-full rounded-full bg-signal',
                  'transition-[width,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  state === 'done' ? 'w-full' : state === 'current' ? 'w-1/2' : 'w-0',
                  reachable && 'group-hover:bg-signal-ink',
                  filled === position && state === 'done' && 'animate-tc-progress',
                )}
              />
            </span>
          );

          if (reachable) {
            return (
              <li key={position} className="flex">
                {/* The hairline is 1px tall; the button around it is 24 and
                    carries its own padding, because a 1px hit target is a
                    decoration with an onClick. */}
                <button
                  type="button"
                  onClick={() => onJump?.(position)}
                  className="group flex h-6 cursor-pointer items-center rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="sr-only">{nameFor(position, state)}</span>
                  {bar}
                </button>
              </li>
            );
          }

          return (
            <li
              key={position}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex h-6 items-center px-1"
            >
              <span className="sr-only">{nameFor(position, state)}</span>
              {bar}
            </li>
          );
        })}
      </ol>

      <span
        key={index}
        aria-hidden="true"
        className="animate-tc-value hidden truncate tc-meta text-muted-foreground sm:block"
      >
        {stepLabel}
      </span>
    </div>
  );
}

export function OnboardingFrame({
  index,
  total,
  stepLabel,
  stepLabels,
  direction = 'forward',
  onJump,
  onBack,
  onNext,
  canBack,
  canNext,
  nextLabel = 'Continue',
  hideFooter = false,
  aside,
  onSkip,
  exitHref,
  children,
}: {
  /** 0-based position of the current step. Doubles as the remount key. */
  index: number;
  total: number;
  stepLabel: string;
  /** Every step's short name, in flow order. Names the steps for a screen
   *  reader; without it they are announced by number alone. */
  stepLabels?: readonly string[];
  /** Which way the flow just moved, so the entrance can say so. */
  direction?: StepDirection;
  /** Go back to an already-completed step. Omit to leave progress inert —
   *  which is what the build step does, since leaving mid-crawl is not a
   *  correction, it is an abandoned chatbot. */
  onJump?: (position: number) => void;
  onBack: () => void;
  onNext: () => void;
  canBack: boolean;
  /** From `canAdvance`. Continue is disabled, never silently inert. */
  canNext: boolean;
  nextLabel?: string;
  /** The build step runs its own CTA, so it hides this one. */
  hideFooter?: boolean;
  aside?: ReactNode;
  /** A returning customer's way past a survey question. Omitted when absent. */
  onSkip?: () => void;
  /** A returning customer's way out of the flow entirely. */
  exitHref?: string;
  children: ReactNode;
}) {
  const stepRef = useRef<HTMLDivElement | null>(null);

  /* Focus follows the step. Without this, changing screen leaves a keyboard
     reader on a control that no longer exists and a screen reader saying
     nothing at all — the new question is simply never announced.

     Keyed on a ref rather than a mount flag so it cannot fire on first paint:
     Strict Mode mounts every effect twice in development, and a flag set on
     the first pass would make the second pass steal focus on arrival. */
  const focusedRef = useRef(index);
  useEffect(() => {
    if (focusedRef.current === index) return;
    focusedRef.current = index;
    stepRef.current?.focus({ preventScroll: true });
  }, [index]);

  /* Continue becoming usable is a state change nothing else reports: the
     button is already on screen and only its opacity moves. One pulse at the
     transition, and only at the transition — the previous value lives in a ref
     because `canNext` is recomputed on every keystroke. */
  const [ready, setReady] = useState(false);
  const wasReadyRef = useRef(canNext);
  useEffect(() => {
    const was = wasReadyRef.current;
    wasReadyRef.current = canNext;
    if (canNext && !was) setReady(true);
    else if (!canNext) setReady(false);
  }, [canNext]);

  /* Enter pressed on a step that will not advance. Silence is the wrong
     answer — the reader did ask for something — so the CTA shakes its head
     once and the disabled state explains itself. */
  const [refused, setRefused] = useState(false);

  /* Enter advances, except where Enter already means something. A textarea
     needs its newline, a button needs its own activation, and a select needs
     its own keyboard. Anything else — an input, the section's own ground —
     is a question the reader has finished answering.

     ⌘↵ / Ctrl+↵ is the exception to the exception: it advances from anywhere,
     including from inside the textarea, because somebody who has just typed a
     paragraph should not have to go looking for the button. */
  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter') return;

    const shortcut = event.metaKey || event.ctrlKey;
    if (!shortcut) {
      if (event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'button' || tag === 'select' || tag === 'a') return;
      if (target?.isContentEditable) return;
    }

    /* Escape is not trapped: a dialog above this frame, or the browser's own
       handling, gets it. Nor is Tab — every control here stays in the page's
       own focus order. */
    if (hideFooter) return;

    /* A step that has already answered this Enter owns the feedback for it.
       The source step shakes its own address field and moves the caret to a
       missing name; a second shake on the disabled CTA for the same keypress
       reads as two complaints about one mistake, and the reader cannot tell
       which of the two things is wrong. Whoever called `preventDefault` first
       was closer to the problem. */
    if (event.defaultPrevented) return;

    event.preventDefault();
    if (!canNext) {
      setRefused(true);
      return;
    }
    onNext();
  }

  return (
    <div className={SHELL}>
      <header className="shrink-0 border-b border-border">
        <div className={HEAD_ROW}>
          <OnboardingBrand />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {onSkip ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            ) : null}
            {exitHref ? (
              <Link
                href={exitHref}
                className="group flex items-center gap-1.5 rounded-md px-2 py-1 tc-meta text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Lineicons
                  icon={ArrowLeftOutlined}
                  className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
                />
                Back to console
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* `m-auto` rather than `items-center`: auto margins collapse to zero
          when the content is taller than the space, so a 640px-tall window
          scrolls instead of cutting the top off the question. The extra bottom
          padding below `sm` is the room the pinned action bar occupies, so the
          end of the page can still be scrolled clear of it. */}
      <main className={cn(MAIN_PAD, hideFooter ? 'pb-8 lg:pb-12' : 'pb-24 sm:pb-8 lg:pb-12')}>
        <div className={CENTRE}>
          <div className={COLUMNS}>
            {/* A form, so Enter and a submit button behave the way the
                browser already decided they behave. */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canNext && !hideFooter) onNext();
              }}
              onKeyDown={onKeyDown}
              className="min-w-0"
            >
              <StepProgress
                index={index}
                total={total}
                stepLabel={stepLabel}
                stepLabels={stepLabels}
                onJump={onJump}
              />

              {/* The frame instance persists across steps, so the step's own
                  identity is the key — without it the entrance plays once and
                  never again, and `data-dir` would have nothing to replay.

                  `tabIndex`/`aria-label` make this the thing focus lands on
                  when the step changes: a named group announces "Step 3 of 6:
                  Answers" and then leaves Tab pointing at the first field. The
                  ring is suppressed because focus here is orientation, not an
                  invitation — a box drawn round the whole question reads as an
                  error, and nothing can reach this node with Tab anyway. */}
              <div
                key={index}
                ref={stepRef}
                tabIndex={-1}
                role="group"
                aria-label={`Step ${index + 1} of ${total}: ${stepLabel}`}
                data-dir={direction}
                className="tc-step mt-8 outline-none"
              >
                {children}
              </div>

              {hideFooter ? null : (
                /* Pinned to the bottom of the viewport on a phone and in
                   normal flow from `sm` up. On a small screen the answers plus
                   the rail below them can push Continue past the fold, and a
                   primary action you have to go looking for is the one thing
                   this frame exists to prevent. */
                <div className="sticky bottom-0 z-10 -mx-4 mt-10 flex flex-col-reverse gap-2.5 border-t border-border bg-background px-4 pt-4 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:pt-6 sm:pb-0">
                  {canBack ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onBack}
                      className="group sm:w-auto"
                    >
                      <Lineicons
                        icon={ArrowLeftOutlined}
                        className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5"
                      />
                      Back
                    </Button>
                  ) : (
                    <span aria-hidden="true" className="hidden sm:block" />
                  )}

                  <div className="flex items-center justify-end gap-3">
                    {/* Only once it is true. A hint for something that will not
                        happen is one more thing to read and ignore. */}
                    {canNext ? (
                      <span className="animate-tc-value hidden items-center gap-1.5 sm:flex">
                        <Kbd>⏎</Kbd>
                        <span className="tc-path text-muted-foreground">to continue</span>
                      </span>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={!canNext}
                      /* Both flourishes take themselves off when they end,
                         which is also what makes them correct under
                         `prefers-reduced-motion`: the duration collapses to
                         1ms, the event still fires, the class still goes. */
                      onAnimationEnd={() => {
                        setReady(false);
                        setRefused(false);
                      }}
                      className={cn(
                        'group w-full sm:w-auto',
                        ready && 'animate-tc-ready',
                        refused && 'animate-tc-shake',
                      )}
                    >
                      {nextLabel}
                      <Lineicons
                        icon={ArrowRightOutlined}
                        className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                      />
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Below the question on a phone, beside it from `lg`. A preview
                the reader has not filled in yet must never be the first thing
                they see. */}
            {aside ? <aside className="min-w-0 lg:pt-1">{aside}</aside> : null}
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The frame before there is a frame
   --------------------------------------------------------------------------
   Shown while the session and the bot list resolve, which decide how many
   steps there are and therefore cannot be guessed. It reuses the chrome's
   own measures rather than approximating them, because the point of a
   skeleton is that nothing moves when the real thing replaces it.

   The rail is held back below `lg`: on a phone it sits under the question, so
   a shimmering block there would be the loading state doing its work entirely
   off screen while pushing nothing around above the fold.
   -------------------------------------------------------------------------- */
export function OnboardingSkeleton() {
  return (
    <div className={SHELL}>
      <header className="shrink-0 border-b border-border">
        <div className={HEAD_ROW}>
          <OnboardingBrand />
        </div>
      </header>

      <main className={cn(MAIN_PAD, 'pb-8 lg:pb-12')}>
        <div className={CENTRE}>
          <div className={COLUMNS}>
            <div className="min-w-0">
              <div className="flex h-6 items-center gap-3">
                <Bone className="h-2.5 w-9" />
                <Bone className="h-0.5 w-[6.75rem]" />
                <Bone className="hidden h-2.5 w-16 sm:block" />
              </div>

              {/* A question, two lines of description and the first step's five
                  choice cards. Not a guess at the exact step — that is not
                  knowable yet — but close enough in height that the vertically
                  centred column does not visibly settle when the real one
                  arrives. */}
              <div className="mt-8">
                <div className="space-y-2.5">
                  <Bone className="h-7 w-4/5 max-w-md" />
                  <Bone className="h-3.5 w-full max-w-lg" />
                  <Bone className="h-3.5 w-2/5 max-w-xs" />
                </div>
                <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                  {Array.from({ length: 5 }, (_, position) => (
                    <Bone key={position} className="h-[4.75rem] w-full rounded-xl" />
                  ))}
                </div>
              </div>

              <div className="mt-10 flex justify-end border-t border-border pt-6">
                <Bone className="h-9 w-full sm:w-32" />
              </div>
            </div>

            <div className="hidden lg:block lg:pt-1">
              <PanelSkeleton bodyHeight="h-56" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
