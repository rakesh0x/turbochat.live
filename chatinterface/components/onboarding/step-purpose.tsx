'use client';

import { useEffect, useRef } from 'react';
import {
  Cart1Outlined,
  Code1Outlined,
  Headphone1Outlined,
  Rocket5Outlined,
  UserMultiple4Outlined,
} from '@lineiconshq/free-icons';
import { Field, Kbd, plural } from '@/components/dashboard/kit';
import { ChoiceCard, ChoiceGrid, StepBody, StepHeading } from '@/components/onboarding/parts';
import { Textarea } from '@/components/ui/textarea';
import type { StepProps } from '@/lib/onboarding';

/* ==========================================================================
   First run  ·  what is this agent for
   --------------------------------------------------------------------------
   The first question is the one that makes every later screen specific: once
   a purpose is on record, the flow can suggest something plausible instead of
   showing an empty field and hoping. Five presets, not twelve — a list you
   can read in one pass gets a real answer, and a long one gets item one.

   Three decisions worth stating:

   · Picking does not advance. This is the screen people change their mind on,
     and a card that jumps to the next question takes that back.

   · Each note is a question that purpose actually produces, not a feature
     line. It is faster to recognise your own inbox than to match a category.

   · The free-text box appears only once a purpose is chosen, and its
     placeholder is written for that purpose. It stays optional — `canAdvance`
     asks for the preset and nothing else — because a paragraph demanded on
     the first screen is where people close the tab.

   And three about how it answers a hand:

   · The five cards arrive in reading order rather than as a block, so the
     first thing the eye does on this screen is read a list, not parse one.

   · 1–5 pick. The key is printed on the card from `sm` up — a shortcut
     nobody can see is a shortcut nobody uses — and hidden on a phone, where
     there is no keyboard to press it with and the row is width we need.

   · Nothing here takes focus by itself. See the box below for why the
     obvious move — dropping the caret into the textarea the moment a card is
     picked — is the one thing this screen must not do.
   ========================================================================== */

const PURPOSES = [
  {
    id: 'support',
    label: 'Customer support',
    note: '“How do I cancel my plan?” — the same twenty questions, every week.',
    icon: Headphone1Outlined,
  },
  {
    id: 'presales',
    label: 'Pre-sales questions',
    note: '“Does it work with Postgres?” — asked before anyone signs up.',
    icon: Cart1Outlined,
  },
  {
    id: 'docs',
    label: 'Docs and developer Q&A',
    note: '“Which endpoint returns usage?” — asked mid-integration.',
    icon: Code1Outlined,
  },
  {
    id: 'internal',
    label: 'Internal lookups',
    note: '“Where is the deploy runbook?” — asked in chat, answered from your pages.',
    icon: UserMultiple4Outlined,
  },
  {
    id: 'onboarding',
    label: 'Onboarding new users',
    note: '“Where do I start?” — a first-week question, asked inside the product.',
    icon: Rocket5Outlined,
  },
] as const;

/* One example sentence per purpose. A placeholder that shows the shape of a
   useful answer gets a useful answer; “tell us about your use case” does not. */
const PROBLEM_PLACEHOLDER: Record<string, string> = {
  support:
    'Our inbox gets the same billing and cancellation questions every week, and the answers are all already in the help centre.',
  presales:
    'People on the pricing page ask about SSO and how per-seat billing works before they will book a call.',
  docs: 'Developers open tickets for things the API reference already answers — usually auth and rate limits.',
  internal:
    'New hires ask the same setup questions in chat, and the answers are spread across four internal pages.',
  onboarding:
    'People sign up, reach an empty dashboard, and ask us where to start instead of reading the guide.',
};

const FALLBACK_PLACEHOLDER = 'The questions you keep answering by hand.';

/* A count, not a limit: nothing truncates this box, so the number is only
   there to say how much has been written once there is something to measure.
   It animates on arrival and then stays still — re-running a 240ms entrance
   on every keystroke would be a twitch, not feedback. Hidden from screen
   readers, which get a length read out by their own editing mode already. */
function CharCount({ value }: { value: string }) {
  if (value.length === 0) return null;
  return (
    <span aria-hidden="true" className="tc-path animate-tc-value shrink-0 text-muted-foreground">
      {value.length} {plural(value.length, 'character')}
    </span>
  );
}

export function StepPurpose({ draft, patch }: StepProps) {
  const chosen = draft.purpose;

  /* Only here to hold a ref: `ChoiceGrid` takes none, and the alternative —
     a document-wide query for a button — would reach outside this step. The
     stagger stays on the grid itself, whose children are the cards. */
  const gridRef = useRef<HTMLDivElement | null>(null);

  /* 1–5, and no key for anything that is not on screen: five presets, five
     digits. Three guards earn a window listener its place. A digit typed into
     the problem box has to stay a digit, so anything editable stands the
     shortcut down. ⌘ and Ctrl belong to the browser (⌘1 switches tab) and are
     never ours — Shift is deliberately allowed through, because on a French
     keyboard a digit is a shifted key and refusing it would switch the
     shortcuts off for an entire layout; a shifted digit on this one is a
     symbol, which fails the range test below anyway. And a held key repeats,
     which would re-pick and re-focus dozens of times. Enter is untouched: the
     frame owns Continue. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (target?.isContentEditable) return;

      const position = Number(event.key);
      if (!Number.isInteger(position) || position < 1 || position > PURPOSES.length) return;

      event.preventDefault();
      patch({ purpose: PURPOSES[position - 1].id });

      /* Focus follows the pick and stops on the card. Someone who has just
         pressed 3 is otherwise left standing on the document body, where the
         next Tab restarts at the header; landing on what they chose means Tab
         goes forward from there and Shift+Tab goes back to what they read. */
      gridRef.current?.querySelectorAll<HTMLButtonElement>('button')[position - 1]?.focus();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [patch]);

  return (
    <>
      <StepHeading
        title="What is this agent for?"
        description="Pick the closest one. It decides what the next screens suggest — nothing here is locked in."
      />

      <StepBody>
        <div ref={gridRef}>
          <ChoiceGrid columns={2} className="tc-stagger">
            {PURPOSES.map((purpose, position) => (
              <ChoiceCard
                key={purpose.id}
                icon={purpose.icon}
                label={
                  <span className="inline-flex items-baseline gap-2">
                    {purpose.label}
                    {/* The glyph is decoration and the words are the fact, so
                        the two are split: a screen reader that read the key as
                        a bare digit would announce “Customer support one”. */}
                    <span aria-hidden="true" className="hidden sm:inline-block">
                      <Kbd>{position + 1}</Kbd>
                    </span>
                    <span className="sr-only">, press {position + 1}</span>
                  </span>
                }
                note={purpose.note}
                multi
                selected={chosen === purpose.id}
                /* One-of, and deliberately no `next()`: see the note above. */
                onClick={() => patch({ purpose: purpose.id })}
              />
            ))}
          </ChoiceGrid>
        </div>

        {/* Rises in as an answer to the choice just made, rather than sitting
            there from the start as one more empty box to get through. The gap
            it opens is not reserved in advance: a hole under the cards before
            anything is picked is a worse first screen than a page that grows
            once, on purpose, in response to a tap. */}
        {chosen ? (
          <div className="animate-tc-rise">
            <Field
              label="What should it handle?"
              htmlFor="onboarding-problem"
              optional
              hint={
                <span className="flex items-baseline justify-between gap-3">
                  <span>In your own words, if it helps to write it down.</span>
                  <CharCount value={draft.problem} />
                </span>
              }
            >
              {/* One ring pulse says the box has just become usable. That is
                  the whole job the caret would otherwise be doing, and the
                  caret cannot have it: auto-focusing a textarea on a pick
                  swallows the reader's next arrow key, switches 1–5 off the
                  moment they might want 2 instead of 3, and presumes a
                  paragraph when the pick alone is already a complete answer.
                  The box is the next Tab stop after the cards, which is as
                  close as focus should get without being asked.

                  Capped as well as floored, because `field-sizing-content`
                  grows this box as it is typed into and an input that pushes
                  Continue down the page on every third word is a moving
                  target — past six lines it scrolls instead. */}
              <div className="animate-tc-ready rounded-md">
                <Textarea
                  id="onboarding-problem"
                  rows={3}
                  className="max-h-36 min-h-20"
                  value={draft.problem}
                  onChange={(event) => patch({ problem: event.target.value })}
                  placeholder={PROBLEM_PLACEHOLDER[chosen] ?? FALLBACK_PLACEHOLDER}
                />
              </div>
            </Field>
          </div>
        ) : null}
      </StepBody>
    </>
  );
}
