'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { CheckOutlined } from '@lineiconshq/free-icons';
import { Kbd } from '@/components/dashboard/kit';
import { cn } from '@/lib/utils';

/* ==========================================================================
   First run  ·  the pieces every step is built from
   --------------------------------------------------------------------------
   Six screens written by different hands will drift unless the parts they are
   made of are decided once. Everything visual that appears on more than one
   step lives here: the heading rhythm, the choice card, the chip.

   These are deliberately thin. They add no surface the console does not
   already have — a choice card is a `tc-tile` that can be pressed, and a chip
   is a bordered pill. Selection reads as `signal`, never the marker: the
   marker means "this is the passage the answer came from" and pointing it at
   a radio button would spend the one piece of brand vocabulary we have.

   Interaction is settled here for the same reason the type is: five screens
   cannot each invent their own idea of what pressing a choice feels like.
   Three rules, decided in this file and nowhere else:

   · A selection confirms itself. The tick lands with a spring — but only when
     a person put it there, never when a saved draft is read back in.
   · Arrows move between the choices in a group, and Tab still reaches every
     one of them individually.
   · Nothing an existing step passes renders differently than it did before.
     Every addition below is an optional prop whose default is the old
     behaviour, because four of the five callers are being written in parallel.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Motion plumbing
   -------------------------------------------------------------------------- */

/* React warns about layout effects during server rendering, and every step
   here is server-rendered before it hydrates. The usual shim: there is nothing
   to paint on the server, so the effect may as well not exist there. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* How long after a screen appears we still assume a change came from the
   machine rather than from a person. The orchestrator hydrates the saved draft
   in its own effect, which lands a commit or two *after* a step mounts, and
   step 4 seeds `widget` the same way — so "was it selected on mount?" cannot
   tell a restore from a choice. Nothing below the step entrance itself (380ms)
   is a human answer: the cards have not finished arriving yet. */
const RESTORE_GRACE_MS = 320;

/** Whether `value` has been changed by a person since this screen appeared.
 *
 *  Sticky once true, which is the point: a re-render in the middle of a 260ms
 *  animation must not pull the class back off and cut it short, and steps
 *  re-render on every keystroke in the field below the choices.
 *
 *  Two simpler versions were tried and rejected:
 *  · Comparing against a ref written during render. React double-invokes
 *    render under Strict Mode and keeps the second pass, so the ref already
 *    holds the new value by the time the kept pass reads it and the animation
 *    never fires in development.
 *  · A plain `useEffect`. It runs after paint, so the tick paints once at full
 *    size and then restarts from `scale(0.4)` — a visible flinch. A layout
 *    effect commits the class before the frame is drawn. */
function useChangedByHand(value: unknown): boolean {
  const [changed, setChanged] = useState(false);
  const previous = useRef(value);
  const bornAt = useRef(Date.now());

  useIsomorphicLayoutEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (Date.now() - bornAt.current > RESTORE_GRACE_MS) setChanged(true);
  }, [value]);

  return changed;
}

/* --------------------------------------------------------------------------
   Heading and body
   -------------------------------------------------------------------------- */

/** The question. One per step, and it is always the largest thing on screen. */
export function StepHeading({
  title,
  description,
  id,
  className,
  focusable = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Lands on the `h1`, so a step can name its own region with `aria-labelledby`. */
  id?: string;
  className?: string;
  /** Make the title a programmatic focus target for a step change. Off by default. */
  focusable?: boolean;
}) {
  return (
    <header className={cn('max-w-xl', className)}>
      <h1
        id={id}
        /* -1, never 0: moving focus here on a step change is how a screen
           reader gets told the question changed, but it must not become a Tab
           stop on the way to the answers. The ring is suppressed with it — the
           step's own entrance already tells a sighted reader what happened,
           and a box round the title would be a second answer to that. */
        tabIndex={focusable ? -1 : undefined}
        className={cn(
          'tc-display text-[1.5rem] leading-[1.18] text-foreground sm:text-[1.75rem]',
          focusable && 'outline-none',
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-2.5 tc-body text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

/** Where a step puts its fields. One rhythm, so no step invents its own.
 *
 *  `children` are the wrapper's *direct* children on purpose. `tc-stagger`
 *  addresses `> *`, so a caller that adds it via `className` gets each field
 *  entering in reading order; slipping an extra div in here would collapse all
 *  of them into one animated block and quietly turn the stagger off. */
export function StepBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-7 space-y-6', className)}>{children}</div>;
}

/* --------------------------------------------------------------------------
   Keyboard  ·  moving between the choices in a group
   --------------------------------------------------------------------------
   A grid that answers only to Tab makes the reader walk through every card to
   reach the fourth one, and it reads as five unrelated buttons that happen to
   be adjacent rather than one question. Arrows are both the accessibility fix
   and most of what makes the group feel like a single control.

   Done from the container, on one bubbled `keydown`: the choices mark
   themselves with `data-tc-choice`, so no step has to hand down a ref or an
   index, and a step stays free to put other things inside the group without
   the count going wrong.

   Deliberately NOT a roving tabindex. These are toggle buttons — several can
   be on at once and `aria-pressed` says which — where the roving pattern
   belongs to a radiogroup with exactly one current item. Leaving every choice
   at tabindex 0 keeps them all individually Tab-reachable, which is what
   someone who has never heard of the arrows will try first.
   -------------------------------------------------------------------------- */

/** Marks a control the container nav should treat as one of its choices. */
const CHOICE_SELECTOR = '[data-tc-choice]:not([disabled])';

const NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/* Rows are measured, not assumed. `columns={2}` collapses to one column below
   `sm`, chips wrap wherever their text runs out of room, and a hardcoded
   stride of 2 would be wrong in both cases — so Up/Down asks the layout where
   the rows actually are. Six pixels of tolerance because a row of chips with
   different icon heights can settle a fraction of a pixel apart. */
function rowsOf(items: HTMLElement[]): number[][] {
  const rows: { top: number; members: number[] }[] = [];
  items.forEach((item, index) => {
    const top = item.getBoundingClientRect().top;
    const row = rows.find((candidate) => Math.abs(candidate.top - top) <= 6);
    if (row) row.members.push(index);
    else rows.push({ top, members: [index] });
  });
  return rows.sort((a, b) => a.top - b.top).map((row) => row.members);
}

function centreOf(item: HTMLElement): number {
  const rect = item.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

/** One row up or down, keeping the horizontal place the reader was already in. */
function moveByRow(items: HTMLElement[], from: number, step: 1 | -1): number {
  const rows = rowsOf(items);
  const row = rows.findIndex((members) => members.includes(from));
  if (row === -1) return from;

  const target = rows[(row + step + rows.length) % rows.length];
  const x = centreOf(items[from]);
  return target.reduce((best, candidate) =>
    Math.abs(centreOf(items[candidate]) - x) < Math.abs(centreOf(items[best]) - x) ? candidate : best,
  );
}

function navigateChoices(event: KeyboardEvent<HTMLElement>) {
  if (!NAV_KEYS.includes(event.key)) return;
  /* A modified arrow is someone else's shortcut — most often the browser's. */
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  const container = event.currentTarget;
  const current = (event.target as HTMLElement | null)?.closest<HTMLElement>(CHOICE_SELECTOR);
  /* Anything else the step put inside the group keeps its own keys: Home in a
     text field means the start of the line, not the first chip. */
  if (!current || !container.contains(current)) return;

  const items = Array.from(container.querySelectorAll<HTMLElement>(CHOICE_SELECTOR)).filter(
    (item) => item === current || item.offsetParent !== null,
  );
  const from = items.indexOf(current);
  if (from === -1 || items.length < 2) return;

  let to = from;
  if (event.key === 'Home') to = 0;
  else if (event.key === 'End') to = items.length - 1;
  else if (event.key === 'ArrowRight') to = (from + 1) % items.length;
  else if (event.key === 'ArrowLeft') to = (from - 1 + items.length) % items.length;
  else to = moveByRow(items, from, event.key === 'ArrowDown' ? 1 : -1);

  /* Swallowed even when the move lands where it started. ArrowDown scrolling
     the page out from under a group the reader is halfway through answering is
     worse than a key that appears to do nothing. */
  event.preventDefault();
  if (to !== from) items[to].focus();
}

/* --------------------------------------------------------------------------
   Choices
   -------------------------------------------------------------------------- */

export function ChoiceGrid({
  children,
  columns = 2,
  className,
  stagger = false,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
  /** Let the cards arrive in reading order. Only honest up to eight of them —
   *  `tc-stagger` stops delaying after the eighth child, so a ninth card would
   *  land first. Off by default, and leave it off if the step already wears
   *  `tc-stagger` on its `StepBody`: nested staggers run at once and muddy. */
  stagger?: boolean;
}) {
  return (
    <div
      onKeyDown={navigateChoices}
      /* Named group, so a card's keyboard hint can react to the whole grid
         being hovered rather than only to its own card. */
      className={cn(
        'group/choices grid gap-2.5',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        stagger && 'tc-stagger',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* A real <button>, so Tab reaches it, Space and Enter press it, and a screen
   reader is told whether it is on. `aria-pressed` is what carries that: it is
   the toggle-button reading, which is what these are — a one-of group of them
   reports one pressed, a many-of group reports several. The full radiogroup
   pattern would need a roving tabindex and buys nothing here, since every card
   is already reachable with Tab. */
export function ChoiceCard({
  icon,
  label,
  note,
  selected,
  onClick,
  multi = false,
  className,
  shortcut,
  disabled = false,
}: {
  icon?: any;
  label: ReactNode;
  note?: ReactNode;
  selected: boolean;
  onClick: () => void;
  /** Report the pressed state. Off only for a card that is not a toggle. */
  multi?: boolean;
  className?: string;
  /** A key the *step* listens for, drawn in the card's lower corner. Display
   *  only — this file has no idea what the key means, and a primitive that
   *  bound document keys would fight whichever step mounted it. */
  shortcut?: string;
  disabled?: boolean;
}) {
  /* Only a selection a person made gets the spring. A card ticked because the
     saved draft came back must sit there as though it had always been on. */
  const changedByHand = useChangedByHand(selected);
  const landing = selected && changedByHand;

  const badge = (
    <span
      aria-hidden="true"
      className={cn(
        'mt-px flex size-4 shrink-0 items-center justify-center rounded-full transition-opacity duration-150',
        selected ? 'bg-signal opacity-100' : 'opacity-0',
        landing && 'animate-tc-tick',
      )}
    >
      <Lineicons icon={CheckOutlined} className="size-2.5 text-signal-ink" />
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={multi ? selected : undefined}
      aria-keyshortcuts={shortcut}
      data-selected={selected ? '' : undefined}
      data-tc-choice=""
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl border p-3.5 text-left',
        /* Touch: kill the tap-highlight flash and the 300ms click delay, and
           stop a double-tap selecting the note text instead of pressing. */
        'select-none touch-manipulation [-webkit-tap-highlight-color:transparent]',
        'transition-[color,background-color,border-color,box-shadow,transform,scale] ease-[cubic-bezier(0.23,1,0.32,1)]',
        /* Faster in than out. Arriving under the pointer should feel like the
           card met you; leaving should feel like it settles back on its own. */
        'duration-200 hover:duration-100 active:duration-75',
        /* The press. A hairline drawn *inside* the top edge reads as the tile
           going down into the page — which is the whole trick in a system with
           no shadows to deepen, and the reason this is not a lift.

           `scale` is named in the transition list above because Tailwind sets
           `scale-*` on the `scale` property rather than on `transform`; left
           out, the press snaps in and out instead of easing back. */
        'active:scale-[0.99] active:shadow-[inset_0_1px_0_0_var(--border-strong)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
        selected
          ? 'border-signal-border bg-signal-soft'
          : 'border-border bg-card hover:border-border-strong hover:bg-surface-2',
        className,
      )}
    >
      {icon ? (
        /* Half the label's duration, so the icon turns before the words do.
           The eye reads that as the card answering rather than repainting. */
        <Lineicons
          icon={icon}
          className={cn(
            'mt-px size-4 shrink-0 transition-colors duration-100',
            selected ? 'text-signal-ink' : 'text-muted-foreground group-hover:text-foreground',
          )}
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block tc-label transition-colors duration-200 delay-[40ms]',
            selected ? 'text-signal-ink' : 'text-foreground',
          )}
        >
          {label}
        </span>
        {note ? (
          <span className="mt-0.5 block tc-meta text-muted-foreground">
            {note}
          </span>
        ) : null}
      </span>
      {/* Both corners of the right edge: the tick at the top where the eye
          checks it, the key hint at the bottom out of the way. Stretching this
          column is what puts them there; with no `shortcut` it holds one child
          and renders exactly as the bare badge did. */}
      <span className="flex shrink-0 flex-col items-end justify-between self-stretch">
        {badge}
        {shortcut ? (
          /* Dim until the reader is somewhere in this grid — a hint that
             announces itself is competing with the answers. `aria-keyshortcuts`
             above is the version a screen reader reads. */
          <span
            aria-hidden="true"
            className="mt-2 opacity-50 transition-opacity duration-150 group-hover/choices:opacity-100 group-focus-within/choices:opacity-100"
          >
            <Kbd>{shortcut}</Kbd>
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** The small answer. A dozen of these read as a set; a dozen cards do not. */
export function Chip({
  icon,
  label,
  selected,
  onClick,
  multi = false,
  className,
  disabled = false,
}: {
  icon?: any;
  label: ReactNode;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={multi ? selected : undefined}
      data-selected={selected ? '' : undefined}
      data-tc-choice=""
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 tc-label',
        /* 34px is a fine target for a pointer and a poor one for a thumb, so
           the phone gets the 36px minimum and everything from `sm` up keeps the
           density it already had — `min-h-0` cannot shrink it back below its
           own padding, so this only ever adds the two pixels on small screens. */
        'min-h-9 sm:min-h-0',
        'select-none touch-manipulation [-webkit-tap-highlight-color:transparent]',
        'transition-[color,background-color,border-color,box-shadow,transform,scale] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'duration-200 hover:duration-100 active:duration-75',
        'active:scale-[0.97] active:shadow-[inset_0_1px_0_0_var(--border-strong)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
        selected
          ? 'border-signal-border bg-signal-soft text-signal-ink'
          : 'border-border bg-card text-foreground hover:border-border-strong hover:bg-surface-2',
        className,
      )}
    >
      {icon ? (
        <Lineicons
          icon={icon}
          className={cn(
            'size-3.5 transition-colors duration-100',
            selected ? 'text-signal-ink' : 'text-muted-foreground',
          )}
        />
      ) : null}
      {label}
    </button>
  );
}

/** A group of chips under a quiet mono label. */
export function ChipGroup({
  label,
  children,
  count,
  action,
  className,
}: {
  label: string;
  children: ReactNode;
  /** How many of this group are picked. Nine chips otherwise say nothing back.
   *  Absent renders nothing at all — a group of two needs no tally. */
  count?: number;
  /** Anything the group itself can do, e.g. a Clear. Sits after the count. */
  action?: ReactNode;
  className?: string;
}) {
  const counted = typeof count === 'number';
  const countChanged = useChangedByHand(count);

  return (
    <div className={cn('space-y-2.5', className)}>
      {/* One row rather than a bare `p`, so the tally shares the eyebrow's
          baseline instead of inventing a second label rhythm. With neither
          `count` nor `action` the row is the paragraph and nothing else. */}
      <div className="flex items-center justify-between gap-3">
        <p className="tc-eyebrow">{label}</p>
        {counted || action ? (
          <span className="flex shrink-0 items-center gap-2.5">
            {counted ? (
              /* Keyed on the number so the node is replaced when it changes:
                 that is what restarts the animation. Teal only once there is
                 something to count — a mono "0 picked" in signal would read as
                 an achievement. */
              <span
                key={count}
                className={cn(
                  'tc-eyebrow',
                  counted && count > 0 && 'text-signal-ink',
                  countChanged && 'animate-tc-value',
                )}
              >
                {count} picked
              </span>
            ) : null}
            {action}
          </span>
        ) : null}
      </div>
      {/* 8px is the floor between two thumb targets, and the wrap gap is the
          same number so a chip is never nearer the row below than beside. */}
      <div onKeyDown={navigateChoices} className="group/choices flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}
