'use client';

import { useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  Book1Outlined,
  CheckCircle1Outlined,
  ClipboardOutlined,
  FileMultipleOutlined,
  Globe1Outlined,
  MinusOutlined,
  NotionOutlined,
  PlusOutlined,
  QuestionMarkCircleOutlined,
} from '@lineiconshq/free-icons';
import { Input } from '@/components/ui/input';
import { Field, FutureTile, Mono, Segmented, plural } from '@/components/dashboard/kit';
import { StepBody, StepHeading } from '@/components/onboarding/parts';
import {
  isPlausibleSite,
  normalizeSite,
  suggestName,
  type Draft,
  type StepProps,
} from '@/lib/onboarding';
import { cn } from '@/lib/utils';

/* ==========================================================================
   First run  ·  the source
   --------------------------------------------------------------------------
   The one screen the product cannot work without: the site we crawl, a name
   for the assistant, and how many pages to read on the first pass.

   The address field is the centrepiece and is built to read as one — the
   tallest control in the flow, the only one that says out loud what it
   understood, and the only one that pushes back when the answer will not do.

   Decisions, each of them the thing that normally goes wrong here:

   · Validation is late and forgiving. Nothing is marked wrong while an address
     is still being typed for the first time — the check starts at the first
     blur of a field with something in it, and at an attempted advance. Once a
     message is showing it re-runs on every keystroke, so it disappears the
     moment the address becomes usable. A paste carrying a scheme, a path, a
     query string or stray whitespace is never rejected; it is canonicalised
     instead, and the line under the field names the part we kept.

   · Motion is spent where it is earned. An attempted advance on a bad address
     shakes the field once, because the frame's Enter does nothing at all when
     the step cannot advance and a key that does nothing reads as a dead page.
     Typing never shakes. A resolved host arrives rather than appears, and its
     tick is the only spring on the screen.

   · The suggested name never clobbers a typed one. The field is ours to write
     into only while nobody has authored anything in it, which is also true
     again if they empty it — so an accidental clear is not a dead end. It now
     says "suggested" while that is true: a name the reader did not type and
     cannot tell was suggested is a name they will not think to change.

   · The page budget is one control instead of two that disagree. `Custom` is a
     fourth segment rather than the absence of a selected one — a typed 42 used
     to leave every preset unlit, which reads as a control that has lost its
     state. The segments are a read-out of the number, so the two halves cannot
     contradict each other, and the ends of the range are a disabled button
     rather than a number that silently refuses to grow.

   · The other sources are drawn, not offered. The crawler reads web pages and
     nothing else today, so PDFs, help centres, pasted text and Notion appear
     as dashed tiles carrying a status word. A dropzone that silently swallowed
     a dragged file would be worse than saying "not yet". They are a footnote
     rather than a panel: as a panel they were the tallest thing on the screen
     and the only thing on it with nothing to do.

   Navigation is the frame's: this step draws a heading, its fields, and no
   buttons, which is why `back` is never called here.
   ========================================================================== */

/* What `Lineicons` takes for `icon`. The package exports no name for it, so it
   is borrowed from an icon this file already imports. */
type Icon = typeof MinusOutlined;

const SITE_ID = 'tc-source-site';
const SITE_NOTE_ID = 'tc-source-site-note';
const SITE_ERROR_ID = 'tc-source-site-error';
const NAME_ID = 'tc-source-name';
const NAME_TAG_ID = 'tc-source-name-suggested';
const NAME_ERROR_ID = 'tc-source-name-error';
const PAGES_ID = 'tc-source-pages';
const FUTURE_ID = 'tc-source-future';

const PAGE_PRESETS = [10, 25, 50] as const;
const CUSTOM = 'custom';
const MIN_PAGES = 1;
const MAX_PAGES = 100;
/* Five at a time, not one: the useful range is a dozen presses wide that way,
   and nobody's first crawl needs single-page precision. Shift gives it to them
   anyway, which is the convention every stepper already teaches. */
const PAGE_STEP = 5;

/* Real tiles at reduced contrast, so the grid does not reflow the day one of
   them ships and the answer to "can it read our Notion?" is on screen rather
   than in a support conversation. */
const FUTURE_SOURCES = [
  {
    icon: FileMultipleOutlined,
    name: 'PDFs and documents',
    note: 'A price list or a manual, answered from the file itself.',
    status: 'Planned',
  },
  {
    icon: Book1Outlined,
    name: 'Help centre import',
    note: 'Articles out of Zendesk or Intercom. A public docs site already works above.',
    status: 'Planned',
  },
  {
    icon: ClipboardOutlined,
    name: 'Pasted text',
    note: 'An answer that is written down nowhere else yet.',
    status: 'Planned',
  },
  {
    icon: NotionOutlined,
    name: 'Notion',
    note: 'Connect a workspace and keep the pages in sync.',
    status: 'Exploring',
  },
] as const;

/* The scheme is drawn as a fixed prefix, so a pasted `https://` would read
   twice. Whitespace goes the same way: a pasted " acme.com " is the same answer
   as `acme.com`, and there is nowhere inside a host that a space belongs.
   Display only — what the address means is still `hostOf`'s answer. */
function stripScheme(raw: string): string {
  return raw.replace(/\s+/g, '').replace(/^https?:\/\//i, '');
}

/** What is wrong, and what a good answer looks like. */
function siteMessage(raw: string): string | null {
  if (raw.trim().length === 0) {
    return 'We need an address before we can read anything. Your home page is the usual answer, like acme.com.';
  }
  if (!isPlausibleSite(raw)) {
    return 'That does not look like a web address. The domain on its own is enough — acme.com — and a full link such as https://acme.com/pricing works too.';
  }
  return null;
}

/** The part of a paste we are about to drop, said out loud. */
function droppedNote(typed: string): string | null {
  /* The crawler is handed the origin, so a path, a query and a hash all go.
     Only the path is worth naming: `?utm=x` is nothing anyone meant to type,
     and reading it back would point at a tracking parameter rather than at the
     page it came from. */
  const path = typed.split('?')[0].split('#')[0].split('/').slice(1).join('/').replace(/\/+$/, '');
  if (path) return `starting at the home page, not /${path}`;
  /* `hostOf` hands `sam@acme.com` back as `acme.com`, which is the charitable
     reading and also a surprising one, so it is stated rather than assumed. */
  if (typed.includes('@')) return 'the domain out of that email address';
  return null;
}

/* `Input` is a plain function component and holds no ref, so the id that ties
   it to its label is also what moves the cursor into it. */
function focusField(id: string, select = false): void {
  if (typeof document === 'undefined') return;
  const node = document.getElementById(id);
  if (!(node instanceof HTMLInputElement)) return;
  node.focus();
  if (select) node.select();
}

function clampPages(count: number): number {
  return Math.min(Math.max(count, MIN_PAGES), MAX_PAGES);
}

/* Both ends of the stepper come from one place so the two cannot drift apart.
   A raw button rather than `Button`, for the same reason `Segmented` uses one:
   these are two halves of a bordered shell, not free-standing controls, so they
   want the shell's full height and none of its own radius. */
function PagesStep({
  icon,
  label,
  onClick,
  disabled,
  className,
}: {
  icon: Icon;
  label: string;
  onClick: () => void;
  disabled: boolean;
  /* The hairline between this button and the number. It lives out here rather
     than on the input, because `Input` already carries `border` on all four
     sides and adding `border-x` to it would leave a rule across the middle of
     the shell — `twMerge` treats the two as different groups and keeps both. */
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-full w-9 shrink-0 items-center justify-center text-muted-foreground',
        'transition-colors hover:bg-card hover:text-foreground active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-40 sm:w-7',
        className,
      )}
    >
      <Lineicons icon={icon} className="size-3.5" aria-hidden="true" focusable="false" />
    </button>
  );
}

export function StepSource({ draft, patch }: StepProps) {
  const [siteTouched, setSiteTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  /* Three one-shot animation flags. Each is set by the event that earned it and
     cleared by the animation's own end rather than by a timer, which is what
     lets the same beat play a second time: the class has to come off before
     re-adding it restarts anything. A `key` would restart it too, but keying a
     field remounts the input inside it, and remounting the input someone is
     typing in takes their caret with it. */
  const [shaking, setShaking] = useState(false);
  const [nameLanded, setNameLanded] = useState(false);
  const [pagesLanded, setPagesLanded] = useState(false);

  /* The page count is held as text as well as a number, because a field you
     cannot empty is a field you cannot retype. The draft only ever receives a
     number; this string is what the box shows on the way there. */
  const [pagesText, setPagesText] = useState(() => String(draft.crawlLimit || ''));

  /* Whether the name in the box is ours to write into or the customer's work.
     Resolved from the draft on the first render rather than defaulted, so a
     name restored from localStorage is classified the way it was when it was
     typed: equal to what we would have suggested means it is still ours. State
     rather than a ref, because the "suggested" tag is a render of it. */
  const [nameOurs, setNameOurs] = useState(
    () => draft.agentName.trim().length === 0 || draft.agentName === suggestName(draft.website),
  );

  const site = draft.website;
  const typed = stripScheme(site);
  const valid = isPlausibleSite(site);
  const siteError = siteTouched && !valid ? siteMessage(site) : null;
  const nameError =
    nameTouched && draft.agentName.trim().length === 0
      ? 'It needs a name before we can build it. Anything will do — it is renameable.'
      : null;

  const host = valid ? normalizeSite(site) : '';
  const dropped = valid ? droppedNote(typed) : null;
  const nameSuggested = nameOurs && draft.agentName.trim().length > 0;
  const nameDescribedBy =
    [nameError ? NAME_ERROR_ID : null, nameSuggested ? NAME_TAG_ID : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const pagesMode = PAGE_PRESETS.some((count) => count === draft.crawlLimit)
    ? String(draft.crawlLimit)
    : CUSTOM;

  function writeSite(raw: string) {
    const website = stripScheme(raw);
    const next: Partial<Draft> = { website };
    if (nameOurs) {
      const suggested = suggestName(website);
      /* Overwrite with something, never with nothing: backspacing an address
         away should not also empty a name that is about to come back. */
      if (suggested) {
        next.agentName = suggested;
        /* Never per character: `suggestName` re-derives on every keystroke, and
           a field that re-animates as it is typed into reads as a glitch rather
           than as a value arriving. It plays on the two events that are one —
           the keystroke that makes the address readable (`valid` is still the
           previous answer here), and a paste that lands a whole new name at
           once — and on nothing else. */
        if (isPlausibleSite(website) && (!valid || suggested !== draft.agentName)) {
          setNameLanded(true);
        }
      }
    }
    patch(next);
  }

  function writeName(raw: string) {
    setNameOurs(raw.trim().length === 0);
    patch({ agentName: raw });
  }

  function onSiteKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    setSiteTouched(true);

    /* The frame only advances on Enter once the step can advance, so an Enter
       on a bad address reaches nothing at all — the message and one shake are
       the whole answer to a key that would otherwise do nothing. */
    if (!valid) {
      event.preventDefault();
      setShaking(true);
      return;
    }

    /* Good address, no name: the cursor moves to the thing that is missing
       instead. They asked to go forward and something went forward. */
    if (draft.agentName.trim().length === 0) {
      event.preventDefault();
      focusField(NAME_ID);
    }
  }

  /* The prefix, the globe and the wrapper's padding are all "the field" as far
     as a press is concerned. Without this, a third of the tallest control on
     the screen is dead. `pointerdown` rather than `mousedown`, because a thumb
     produces the mouse event late and sometimes not at all; preventing the
     default is what stops the press from taking focus back off the input. */
  function onSiteShellPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    focusField(SITE_ID);
  }

  function choosePages(value: string) {
    if (value === CUSTOM) {
      /* Custom is a destination, not a value: the box is where a number that is
         none of the three gets typed, so the segment hands over the caret and
         selects what is there instead of inventing a number to put in it. */
      focusField(PAGES_ID, true);
      return;
    }
    const count = Number(value);
    setPagesText(String(count));
    patch({ crawlLimit: count });
    setPagesLanded(true);
  }

  function writePages(raw: string) {
    const digits = raw.replace(/\D+/g, '').slice(0, 3);
    const parsed = Number.parseInt(digits, 10);
    if (Number.isNaN(parsed) || parsed === 0) {
      /* An empty box is allowed on the way to another number, so the draft
         keeps the last real value and only the text goes blank. */
      setPagesText(digits);
      return;
    }
    /* The ceiling is applied to the text as well as the draft. Letting the box
       say 999 while the rail beside it says 100 puts two different numbers on
       screen for the same setting, which is worse than an abrupt clamp. */
    const capped = Math.min(parsed, MAX_PAGES);
    setPagesText(String(capped));
    patch({ crawlLimit: capped });
  }

  /* Clamped when the field is left rather than while it is being typed in: 5 on
     the way to 50 is not a mistake worth interrupting. */
  function commitPages() {
    const parsed = Number.parseInt(pagesText, 10);
    const clamped = Number.isNaN(parsed) ? draft.crawlLimit : clampPages(parsed);
    setPagesText(String(clamped));
    patch({ crawlLimit: clamped });
  }

  function stepPages(delta: number) {
    const shown = Number.parseInt(pagesText, 10);
    const base = Number.isNaN(shown) ? draft.crawlLimit : shown;
    /* A coarse press lands on the step's own grid — 42 then + is 45, not 47 —
       so repeated presses walk round numbers instead of carrying a stray digit
       along. A fine press (Shift) is left alone, since asking for 43 and
       getting 41 would be the opposite of precision. */
    const from =
      Math.abs(delta) === PAGE_STEP
        ? delta > 0
          ? Math.floor(base / PAGE_STEP) * PAGE_STEP
          : Math.ceil(base / PAGE_STEP) * PAGE_STEP
        : base;
    const next = clampPages(from + delta);
    setPagesText(String(next));
    patch({ crawlLimit: next });
  }

  function onPagesKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    /* Nowhere for the caret to go in a one-line field, and the frame only
       listens for Enter, so the arrows are free to be the dial. */
    event.preventDefault();
    const direction = event.key === 'ArrowUp' ? 1 : -1;
    stepPages(direction * (event.shiftKey ? 1 : PAGE_STEP));
  }

  return (
    <>
      <StepHeading
        title="Which site should it read?"
        description="Your pages are what it answers from. One address is enough to start — the crawler follows the links it finds there."
      />

      {/* Four children, in reading order: the address, its name, its budget,
          and the footnote. The address is first in the cascade as well as on
          the page, so the first thing that lands is the thing to answer. */}
      <StepBody className="tc-stagger">
        <Field
          label="Website"
          htmlFor={SITE_ID}
          error={
            siteError ? (
              <span key={siteError} id={SITE_ERROR_ID} className="animate-tc-value block">
                {siteError}
              </span>
            ) : null
          }
          hint="Your home page is the usual answer. Everything it can reach from there is fair game."
        >
          {/* Taller than every other control in the flow — it is the one answer
              the product cannot be built without, and 44px is what a thumb
              needs. The ring sits on the wrapper rather than the input, because
              the scheme is part of the field as far as the reader is concerned
              and a focus treatment that stops halfway across a control reads as
              a rendering bug. Deliberately not `type="url"`: the browser would
              call `acme.com` invalid, which is the one thing we are asking for. */}
          <div
            onPointerDown={onSiteShellPointerDown}
            onAnimationEnd={(event) => {
              /* The shake disarms itself so the next attempt can replay it. Its
                 own event only: an animation added to anything inside this shell
                 later would bubble through here and cut the shake short. */
              if (event.target === event.currentTarget) setShaking(false);
            }}
            className={cn(
              'flex h-11 cursor-text items-center gap-2 rounded-md border bg-surface-2 px-3 sm:h-10',
              'transition-[border-color,box-shadow] focus-within:ring-2 focus-within:ring-ring/50',
              siteError
                ? 'border-danger-border'
                : 'border-border hover:border-border-strong focus-within:border-border-strong',
              shaking && 'animate-tc-shake',
            )}
          >
            {/* The state is a shape before it is a colour: a globe while we can
                read the address, a question mark while we cannot. */}
            <Lineicons
              icon={siteError ? QuestionMarkCircleOutlined : Globe1Outlined}
              className={cn(
                'size-4 shrink-0 transition-colors',
                siteError ? 'text-danger' : 'text-muted-foreground',
              )}
              aria-hidden="true"
              focusable="false"
            />
            <span aria-hidden="true" className="tc-path shrink-0 select-none text-muted-foreground">
              https://
            </span>
            <Input
              id={SITE_ID}
              value={typed}
              onChange={(event) => writeSite(event.target.value)}
              onBlur={() => {
                if (site.trim().length > 0) setSiteTouched(true);
              }}
              onKeyDown={onSiteKeyDown}
              placeholder="acme.com"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={siteError ? true : undefined}
              aria-describedby={siteError ? SITE_ERROR_ID : valid ? SITE_NOTE_ID : undefined}
              className="h-full border-0 bg-transparent px-0 focus-visible:border-0 focus-visible:ring-0"
            />
          </div>

          {/* One line, always reserved, so resolving an address does not shove
              the hint under it down the page. It is what we understood, in the
              same monospace the console uses for a crawled host, and it arrives
              rather than blinking into place — keyed on the host so a new one
              re-runs the beat and a keystroke that changes nothing does not.
              What it reports is the origin, because that is what the build step
              is handed; a dropped path or a pasted email address is exactly the
              thing a reader would otherwise only discover afterwards. */}
          <div
            id={SITE_NOTE_ID}
            aria-live="polite"
            aria-atomic="true"
            /* Reserved while there is nothing wrong, and not while there is: the
               height is there to stop a resolving host pushing the hint down,
               and holding it open under a message would only push the message
               away from the field it is about. */
            className={cn(siteError ? 'min-h-0' : 'min-h-5')}
          >
            {valid ? (
              <p
                key={host}
                className="animate-tc-value flex flex-wrap items-center gap-x-1.5 gap-y-1 tc-meta text-muted-foreground"
              >
                <Lineicons
                  icon={CheckCircle1Outlined}
                  className="animate-tc-tick size-3.5 shrink-0 text-signal"
                  aria-hidden="true"
                  focusable="false"
                />
                Reading <Mono className="text-foreground">{host}</Mono>
                {dropped ? <span>· {dropped}</span> : null}
              </p>
            ) : null}
          </div>
        </Field>

        <Field
          label="What should it be called?"
          htmlFor={NAME_ID}
          error={
            nameError ? (
              <span key={nameError} id={NAME_ERROR_ID} className="animate-tc-value block">
                {nameError}
              </span>
            ) : null
          }
          hint="Sits at the top of the chat window. Renameable whenever you like."
        >
          {/* The value arrives instead of materialising. Without the motion, a
              name that filled itself in from the address is indistinguishable
              from one the reader typed and forgot about. */}
          <div
            className={cn('relative', nameLanded && 'animate-tc-value')}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setNameLanded(false);
            }}
          >
            <Input
              id={NAME_ID}
              value={draft.agentName}
              onChange={(event) => writeName(event.target.value)}
              onBlur={() => setNameTouched(true)}
              placeholder="Acme assistant"
              autoComplete="off"
              maxLength={60}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameDescribedBy}
              className={cn(nameSuggested && 'pr-24')}
            />
            {/* Ours until they touch it, and it says so. Not a button: there is
                nothing to accept — the name is already in the box, and the way
                to reject it is to type over it, which is also what makes the
                tag disappear. Pointer-events off so the right end of the field
                still takes a click. */}
            {nameSuggested ? (
              <span
                id={NAME_TAG_ID}
                className="tc-path pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-1.5 py-px text-muted-foreground"
              >
                suggested
              </span>
            ) : null}
          </div>
        </Field>

        <Field
          label="How many pages on the first read?"
          htmlFor={PAGES_ID}
          hint="Fewer pages means it starts answering sooner. The rest of the site can wait until you have seen how it does."
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
            {/* 36px segments on a phone, the console's own density above it. The
                child selector is the only way in from out here and it is worth
                it: a thumb cannot reliably hit a 24px target. */}
            <Segmented
              value={pagesMode}
              onChange={choosePages}
              options={[
                ...PAGE_PRESETS.map((count) => ({ value: String(count), label: String(count) })),
                { value: CUSTOM, label: 'Custom' },
              ]}
              size="sm"
              className="h-10 [&>button]:h-9 sm:h-7 sm:[&>button]:h-6"
            />

            {/* A dial rather than a box with a number in it: ±5 crosses the
                useful range in a dozen presses, the arrow keys do the same from
                the keyboard, and the two ends of the range are a disabled
                button instead of a number that silently refuses to move. */}
            <div className="tc-inset flex h-10 items-center overflow-hidden focus-within:ring-2 focus-within:ring-ring/50 sm:h-7">
              <PagesStep
                icon={MinusOutlined}
                label={`Fewer pages, ${PAGE_STEP} at a time`}
                onClick={() => stepPages(-PAGE_STEP)}
                disabled={draft.crawlLimit <= MIN_PAGES}
                className="border-r border-border"
              />
              <Input
                id={PAGES_ID}
                value={pagesText}
                onChange={(event) => writePages(event.target.value)}
                onBlur={commitPages}
                onKeyDown={onPagesKeyDown}
                /* Only a preset jump animates. A press of ± is a continuous
                   movement, and re-running an entrance on each one would read
                   as a stutter rather than as a number changing. */
                onAnimationEnd={() => setPagesLanded(false)}
                inputMode="numeric"
                aria-label="Pages to read on the first pass"
                className={cn(
                  'tc-num h-full w-12 border-0 bg-transparent px-0 text-center focus-visible:ring-0 sm:w-11',
                  pagesLanded && 'animate-tc-value',
                )}
              />
              <PagesStep
                icon={PlusOutlined}
                label={`More pages, ${PAGE_STEP} at a time`}
                onClick={() => stepPages(PAGE_STEP)}
                disabled={draft.crawlLimit >= MAX_PAGES}
                className="border-l border-border"
              />
            </div>

            <span className="tc-path text-muted-foreground">
              {plural(draft.crawlLimit, 'page', 'pages')}
            </span>
          </div>
        </Field>

        {/* A footnote, not a panel. Same four sources, same "not yet", a third
            of the height: the panel header, description and footer said in one
            line beside the heading, and each source a single dense row. A
            disclosure was the obvious alternative and the wrong one — hiding
            this answers "can it read our Notion?" with a shrug, and the
            question is common enough to deserve a visible answer. */}
        <section aria-labelledby={FUTURE_ID} className="space-y-2.5 border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id={FUTURE_ID} className="tc-eyebrow">
              /crawl · other places it could read from
            </h2>
            <p className="tc-meta text-muted-foreground">
              Nothing to switch on yet — web pages are all the crawler reads today.
            </p>
          </div>
          {/* A list, so a screen reader is told there are four of them and can
              leave after the first. */}
          <ul className="grid gap-2 sm:grid-cols-2">
            {FUTURE_SOURCES.map((source) => (
              <li key={source.name}>
                <FutureTile
                  icon={source.icon}
                  name={source.name}
                  note={source.note}
                  status={source.status}
                  className="h-full gap-2.5 p-3"
                />
              </li>
            ))}
          </ul>
        </section>
      </StepBody>
    </>
  );
}
