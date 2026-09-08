'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bolt2Outlined,
  Book1Outlined,
  Comment1Outlined,
  Message2Outlined,
} from '@lineiconshq/free-icons';
import { Field, Kbd, plural } from '@/components/dashboard/kit';
import { ChoiceCard, ChoiceGrid, StepBody, StepHeading } from '@/components/onboarding/parts';
import { Textarea } from '@/components/ui/textarea';
import { hostOf, type Draft, type StepProps } from '@/lib/onboarding';

/* ==========================================================================
   First run  ·  how should it answer
   --------------------------------------------------------------------------
   By this screen we know the purpose and the site, which is enough to write
   the instruction paragraph for them. So we do: pick a register and the box
   below fills with something a customer would have typed anyway, phrased for
   their audience and their host. Editing a draft is a far smaller ask than
   facing an empty textarea labelled "instructions".

   Two things this screen is careful about:

   · A prefill must never overwrite a person's own words. Once the text has
     been edited, changing tone leaves it alone. Clearing the box counts as
     handing it back to us.

   · The draft never promises work this product cannot do. It answers from
     indexed pages — it does not process refunds, look up an order, or touch
     an account, and instructions that imply otherwise turn into a support
     ticket later.

   And the field is honest about where it goes: `POST /api/chatbot/create`
   accepts a name, a site and a page budget. There is no endpoint that stores
   a system prompt, so this text stays with the draft. The hint says so.

   Interaction, for the same reasons as the first screen: the four cards
   arrive in reading order, 1–4 pick one, and the printed key is a desktop
   affordance. The one thing particular to this screen is that a pick has a
   visible consequence — it writes a paragraph — so the paragraph arrives
   rather than appearing, and only when it was really rewritten.
   ========================================================================== */

const TONES = [
  {
    id: 'plain',
    label: 'Plain',
    note: '“Yes, on the Pro plan. Here is the page.”',
    icon: Message2Outlined,
  },
  {
    id: 'warm',
    label: 'Warm',
    note: '“Happy to help — you can change that in Settings.”',
    icon: Comment1Outlined,
  },
  {
    id: 'brief',
    label: 'Brief',
    note: '“Pro plan only. Settings, then Billing.”',
    icon: Bolt2Outlined,
  },
  {
    id: 'formal',
    label: 'Formal',
    note: '“Certainly. That option is available on the Pro plan.”',
    icon: Book1Outlined,
  },
] as const;

/* Who is asking, in the words of the purpose they picked on the first screen. */
const AUDIENCE: Record<string, string> = {
  support: 'customers trying to get something done',
  presales: 'visitors deciding whether to buy',
  docs: 'developers working against the API',
  internal: 'colleagues looking something up',
  onboarding: 'people in their first week with the product',
};

const TONE_LINE: Record<string, string> = {
  plain: 'Write plainly. Short sentences, no filler, no sales language.',
  warm: 'Be warm and unhurried, but never chirpy. Answer first, reassure second.',
  brief: 'Two or three sentences at most. Lead with the answer.',
  formal: 'Keep the register formal: full sentences, no contractions, no slang.',
};

/* Pure, so the same answers always produce the same paragraph — that is what
   lets us tell whether the text on screen is still ours or now theirs. */
function draftInstructions(draft: Draft): string {
  const host = hostOf(draft.website) || 'the site';
  const audience = AUDIENCE[draft.purpose ?? ''] ?? 'visitors asking about the product';
  const tone = TONE_LINE[draft.tone ?? ''] ?? TONE_LINE.plain;

  return [
    `You answer questions about ${host} for ${audience}. Use only what is on the pages we indexed, and point to the page an answer came from.`,
    `When the pages do not cover something, say that plainly and send them to the contact page rather than guessing. You cannot look up an account, change a subscription, or act on anyone's behalf.`,
    tone,
  ].join('\n\n');
}

/* Same count, same reasoning, as the problem box on the first screen: a
   measure of a paragraph nobody is going to truncate, animated once when it
   first appears and left alone after that. */
function CharCount({ value }: { value: string }) {
  if (value.length === 0) return null;
  return (
    <span aria-hidden="true" className="tc-path animate-tc-value shrink-0 text-muted-foreground">
      {value.length} {plural(value.length, 'character')}
    </span>
  );
}

export function StepShape({ draft, patch }: StepProps) {
  /* Whether the text belongs to the customer yet. Resolved on first render
     rather than defaulted to false, so a draft restored after a refresh does
     not lose a paragraph the customer wrote in the previous session: text
     that still matches what we would have written counts as ours. */
  const touched = useRef<boolean | null>(null);
  if (touched.current === null) {
    touched.current =
      draft.instructions.trim().length > 0 && draft.instructions !== draftInstructions(draft);
  }

  const gridRef = useRef<HTMLDivElement | null>(null);

  /* How many times we have actually written into the box. Counting rather
     than flagging, because it has to be able to say "again" — a second tone
     press that redrafts the same length of paragraph must still read as a
     change. */
  const [redrafts, setRedrafts] = useState(0);

  function chooseTone(id: string) {
    const nextDraft = { ...draft, tone: id };
    patch(
      touched.current
        ? { tone: id }
        : { tone: id, instructions: draftInstructions(nextDraft) },
    );
    /* Only a real redraft earns the beat below. Animating the box when the
       customer's own words were deliberately left alone would announce a
       change that did not happen. */
    if (!touched.current) setRedrafts((count) => count + 1);
  }

  /* The keyboard handler is bound once and reads the current picker through a
     ref: `chooseTone` closes over the draft, so putting it in the dependency
     list would swap the window listener out on every keystroke in the box. */
  const chooseRef = useRef(chooseTone);
  useEffect(() => {
    chooseRef.current = chooseTone;
  });

  /* 1–4: four registers, four digits, nothing pointing at a fifth card that
     does not exist. Guards as on the first screen — the instructions box is
     right below this grid, and a 2 typed into a paragraph is a 2. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (target?.isContentEditable) return;

      const position = Number(event.key);
      if (!Number.isInteger(position) || position < 1 || position > TONES.length) return;

      event.preventDefault();
      chooseRef.current(TONES[position - 1].id);

      /* Focus lands on the card, never in the box: the draft underneath is
         there to be read before it is edited, and a caret dropped into it
         would take both the reader's place in the page and the shortcuts. */
      gridRef.current?.querySelectorAll<HTMLButtonElement>('button')[position - 1]?.focus();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <StepHeading
        title="How should it answer?"
        description="Pick a register. We draft the instructions underneath from that, your purpose, and your site."
      />

      <StepBody>
        <div ref={gridRef}>
          <ChoiceGrid columns={2} className="tc-stagger">
            {TONES.map((tone, position) => (
              <ChoiceCard
                key={tone.id}
                icon={tone.icon}
                label={
                  <span className="inline-flex items-baseline gap-2">
                    {tone.label}
                    <span aria-hidden="true" className="hidden sm:inline-block">
                      <Kbd>{position + 1}</Kbd>
                    </span>
                    <span className="sr-only">, press {position + 1}</span>
                  </span>
                }
                note={tone.note}
                multi
                selected={draft.tone === tone.id}
                onClick={() => chooseTone(tone.id)}
              />
            ))}
          </ChoiceGrid>
        </div>

        {/* Not revealed by the pick the way the first screen's box is, and
            that is deliberate: the placeholder invites writing this yourself,
            and a field that is not there until a register is chosen takes that
            offer back. What ties it to the pick is the arrival below. */}
        <Field
          label="Instructions"
          htmlFor="onboarding-instructions"
          hint={
            <span className="flex items-baseline justify-between gap-3">
              <span>
                Kept with your notes — the answering prompt is server-set for now, so nothing here is
                saved to your bot.
              </span>
              <CharCount value={draft.instructions} />
            </span>
          }
        >
          {/* Keyed on the redraft count so the paragraph drops in from above
              each time we write it. Two identical drafts differing by one
              clause are otherwise indistinguishable from a re-render, and the
              reader has to diff a paragraph to notice their tap worked.

              Remounting the textarea is safe precisely here: a redraft only
              follows a tone press, and focus is never inside this box at that
              moment — the number keys stand down while it has focus, and a
              card press moves focus to the card. Capped in height because a
              three-paragraph draft grows this box past a phone screen. */}
          <div key={redrafts} className={redrafts > 0 ? 'animate-tc-value' : undefined}>
            <Textarea
              id="onboarding-instructions"
              rows={7}
              className="max-h-72"
              value={draft.instructions}
              onChange={(event) => {
                const value = event.target.value;
                /* Emptying the box gives it back: there is no edit left to
                   protect, so the next tone may draft into it again. */
                touched.current = value.trim().length > 0;
                patch({ instructions: value });
              }}
              placeholder="Pick a tone above and we will draft this, or write it yourself."
            />
          </div>
        </Field>
      </StepBody>
    </>
  );
}
