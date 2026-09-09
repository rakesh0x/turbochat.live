'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/dashboard/kit';
import { Chip, ChipGroup, StepBody, StepHeading } from '@/components/onboarding/parts';
import {
  Book1Outlined,
  GoogleOutlined,
  LinkedinOutlined,
  RedditOutlined,
  SparkOutlined,
  User4Outlined,
  XOutlined,
  YoutubeOutlined,
} from '@lineiconshq/free-icons';
import type { StepProps } from '@/lib/onboarding';

/* ==========================================================================
   First run  ·  how did you hear about us
   --------------------------------------------------------------------------
   The last question before the build, and the only one that is for us rather
   than for the customer. It is attribution: it tells us which channel is
   earning attention so we can spend more there. It is not dressed up as
   personalisation, because nothing on the next screen changes based on it.

   Everything about the screen argues for being small. It sits between three
   questions that decide what the agent is and a screen that builds it, so any
   weight here reads as one more hoop. One row of chips, one optional field
   that only appears when there is something worth typing, one line at the
   bottom telling the customer what Continue starts.

   What this screen deliberately does not do:

   · It does not require an answer, or the detail. `canAdvance` returns true;
     a forced attribution answer is a wrong attribution answer.

   · It does not promise a timing it cannot know. A crawl's length depends on
     the site, so the closing line says the site gets read and the agent
     starts answering, and names no number of minutes.

   · It does not offer "Other" as a text box for the source itself. Somewhere
     else plus one optional line is the same information with one fewer
     required field.

   · It does not animate the chip that was just tapped. The obvious beat — a
     tick landing, or replaying the chip's entrance — needs the node replaced
     to restart a CSS animation, and replacing the button the reader has this
     instant clicked throws their focus back to the top of the document. The
     confirmation is carried by things that cost nothing: the border and fill
     swap inside 100ms, Clear appearing beside the label, and for six of the
     eight sources a second field arriving underneath.
   ========================================================================== */

const SOURCES = [
  { id: 'search', label: 'Google or search', icon: GoogleOutlined },
  { id: 'x', label: 'X', icon: XOutlined },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinOutlined },
  { id: 'youtube', label: 'YouTube', icon: YoutubeOutlined },
  { id: 'reddit', label: 'Reddit', icon: RedditOutlined },
  { id: 'referral', label: 'A friend or colleague', icon: User4Outlined },
  { id: 'newsletter', label: 'A newsletter or blog', icon: Book1Outlined },
  { id: 'other', label: 'Somewhere else', icon: SparkOutlined },
] as const;

/* Only the sources where a second line tells us something we cannot infer.
   Search needs nothing: we already know the source is search, and the query
   is not something a customer remembers accurately. */
const DETAIL: Record<string, { label: string; placeholder: string }> = {
  referral: { label: 'Who should we thank?', placeholder: 'Their name or company' },
  newsletter: { label: 'Which newsletter or blog?', placeholder: 'Name or link' },
  youtube: { label: 'Which video or channel?', placeholder: 'Name or link' },
  x: { label: 'Which post or account?', placeholder: '@handle or link' },
  linkedin: { label: 'Which post or account?', placeholder: 'Name or link' },
  reddit: { label: 'Which subreddit or thread?', placeholder: 'r/… or link' },
  other: { label: 'Where was it?', placeholder: 'A podcast, a conference, a colleague' },
};

const DETAIL_ID = 'tc-discovery-detail';

export function StepDiscovery({ draft, patch }: StepProps) {
  const detail = draft.discovery ? DETAIL[draft.discovery] : undefined;

  /* The cursor is moved into the detail field when one appears, because a
     reader who has just answered "a friend or colleague" is about to type a
     name and should not have to find the box. It is gated on a pick actually
     having happened in this session: a returning customer landing here with a
     saved answer would otherwise have their cursor yanked into a box they did
     not ask for, and on a phone the keyboard would open with it. */
  const picked = useRef(false);
  useEffect(() => {
    if (!picked.current || !detail) return;
    const node = document.getElementById(DETAIL_ID);
    if (node instanceof HTMLInputElement) node.focus({ preventScroll: true });
  }, [draft.discovery, detail]);

  function choose(id: string) {
    picked.current = true;
    /* Re-picking the current answer clears it. The question is optional, so
       there has to be a way back out of it, and the alternative — an answer
       that can be changed but never withdrawn — is how surveys collect their
       worst data.

       Switching source drops the detail with it: "a colleague" is not an answer
       to "which subreddit?", and leaving it in place would file it as one. */
    patch(
      id === draft.discovery
        ? { discovery: null, discoveryDetail: '' }
        : { discovery: id, discoveryDetail: '' },
    );
  }

  function clear() {
    picked.current = false;
    patch({ discovery: null, discoveryDetail: '' });
  }

  return (
    <>
      <StepHeading
        title="How did you find us?"
        description="Last question, and this one is ours rather than yours — it tells us which of these is worth doing more of."
      />

      <StepBody>
        {/* One-of, so each chip reports its own pressed state and the group
            carries the question. Picking the current answer again clears it. */}
        <div role="group" aria-label="How you found us">
          <ChipGroup
            label="Pick one · optional"
            action={
              draft.discovery ? (
                /* Only once there is something to undo. Re-tapping the chip
                   does the same thing, but that is not a discoverable gesture
                   and this is the screen where a mis-tap is least worth
                   arguing with. */
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="tc-path h-6 px-2 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              ) : null
            }
          >
            {/* `contents` so the chips stay the flex row's own items and keep
                their wrap and 8px gutters, while `tc-stagger > *` still reaches
                them and walks them in in reading order — eight sources is
                exactly the number it delays before it gives up. Staggering
                `ChipGroup`'s wrapper instead would animate the label and the
                whole row as two blocks. */}
            <div className="tc-stagger contents">
              {SOURCES.map((source) => (
                <Chip
                  key={source.id}
                  icon={source.icon}
                  label={source.label}
                  multi
                  selected={draft.discovery === source.id}
                  onClick={() => choose(source.id)}
                />
              ))}
            </div>
          </ChipGroup>
        </div>

        {/* Only for the sources where a second line says something we could not
            work out on our own. Mounted on selection, so it arrives with the
            same entrance the rest of the flow uses. */}
        {detail ? (
          <div className="animate-tc-rise">
            <Field label={detail.label} htmlFor={DETAIL_ID} optional>
              <Input
                id={DETAIL_ID}
                value={draft.discoveryDetail}
                onChange={(event) => patch({ discoveryDetail: event.target.value })}
                placeholder={detail.placeholder}
                autoComplete="off"
                maxLength={80}
                className="max-w-sm"
              />
            </Field>
          </div>
        ) : null}

        <p className="tc-path text-muted-foreground">
          Continue starts the build — we read your site, then the agent answers out of it.
        </p>
      </StepBody>
    </>
  );
}
