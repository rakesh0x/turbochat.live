'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  AppleBrandOutlined,
  Comment1Outlined,
  DiscordOutlined,
  Envelope1Outlined,
  Globe1Outlined,
  Headphone1Outlined,
  InstagramOutlined,
  Megaphone1Outlined,
  Message2Outlined,
  NotionOutlined,
  PhoneOutlined,
  Plug1Outlined,
  ShopifyOutlined,
  SlackOutlined,
  Ticket1Outlined,
  UserMultiple4Outlined,
  Wallet1Outlined,
  WebhooksOutlined,
  WhatsappOutlined,
  WordpressOutlined,
} from '@lineiconshq/free-icons';
import { Hairline } from '@/components/dashboard/kit';
import { Chip, ChipGroup, StepBody, StepHeading } from '@/components/onboarding/parts';
import type { StepProps } from '@/lib/onboarding';

/* ==========================================================================
   First run  ·  where it answers, and what you already run
   --------------------------------------------------------------------------
   Two questions on one screen, because neither one shapes the product: the
   agent is built from the customer's site either way. What they shape is our
   order of work, so they are asked together, cheaply, and answered with taps.

   The design problem here is that nine of the eleven channels do not exist. A
   survey that lets someone tick Slack and then says nothing has, in effect,
   promised Slack — and the bill for that arrives a week later in a support
   thread. So the wording is fixed in this file rather than left to tone: the
   widget and the hosted page are named as the two that work today, which is
   the same claim /embed makes in the same words, and everything else carries
   Planned — the word the console's own FutureTile already uses.

   Twenty chips is the densest screen in the flow, and density is the thing it
   has to solve without a second colour: `signal` is already spoken for by
   selection, `success` by Ready, and the marker means "cited from here". So
   the roadmap sits in a sunk well — the recess the console already uses for a
   thing you read rather than a thing you have — and the two that ship stay on
   the page beside their Ready tags. Depth carries the bucket; hue carries
   what you picked.

   What this screen deliberately does not do:

   · It does not connect anything and does not offer to. No integration
     endpoint exists in this product, so there is no Connect button, no OAuth
     hand-off, and no field asking for a token.

   · It does not gate. `canAdvance` returns true for this step. Picking
     nothing is a real answer, and the copy says so — a customer nudged into
     a guess to unblock themselves pollutes the only signal we get.

   · It does not use brand artwork. There is no licensed asset set here, so a
     generic icon carries each row and the name is spelled out in text.
   ========================================================================== */

/* The pair that actually ships. /embed says "the widget and the hosted page
   are the only channels that work today"; this screen must not say fewer or
   more than that. The widget leads because it is what a customer installs. */
const LIVE_CHANNELS = [
  { id: 'widget', label: 'Website widget', icon: Message2Outlined },
  { id: 'hosted-page', label: 'Hosted page', icon: Globe1Outlined },
] as const;

/* Roadmap. The first six are /embed's list in /embed's order — that order is
   by how often customers ask, and two screens showing two different roadmaps
   is a product that does not know itself. The last three are asked about only
   here, because nothing else in the console asks about them at all. */
const PLANNED_CHANNELS = [
  { id: 'slack', label: 'Slack', icon: SlackOutlined },
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsappOutlined },
  { id: 'discord', label: 'Discord', icon: DiscordOutlined },
  { id: 'ios-sdk', label: 'iOS SDK', icon: AppleBrandOutlined },
  { id: 'wordpress', label: 'WordPress', icon: WordpressOutlined },
  { id: 'webhook', label: 'Webhook', icon: WebhooksOutlined },
  { id: 'instagram', label: 'Instagram', icon: InstagramOutlined },
  { id: 'email', label: 'Email', icon: Envelope1Outlined },
  { id: 'phone', label: 'Phone', icon: PhoneOutlined },
] as const;

/* Grouped as a customer would read them: support desk, then CRM, then the
   money and the docs. Icons are generic on purpose — see the header. */
const TOOLS = [
  { id: 'zendesk', label: 'Zendesk', icon: Ticket1Outlined },
  { id: 'intercom', label: 'Intercom', icon: Comment1Outlined },
  { id: 'freshdesk', label: 'Freshdesk', icon: Headphone1Outlined },
  { id: 'help-scout', label: 'Help Scout', icon: Ticket1Outlined },
  { id: 'hubspot', label: 'HubSpot', icon: Megaphone1Outlined },
  { id: 'salesforce', label: 'Salesforce', icon: UserMultiple4Outlined },
  { id: 'shopify', label: 'Shopify', icon: ShopifyOutlined },
  { id: 'stripe', label: 'Stripe', icon: Wallet1Outlined },
  { id: 'notion', label: 'Notion', icon: NotionOutlined },
] as const;

/** A new array every time. The draft is replaced, never pushed into. */
function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function countIn(list: readonly { id: string }[], picked: readonly string[]): number {
  return list.reduce((total, item) => (picked.includes(item.id) ? total + 1 : total), 0);
}

/* What a group is holding, level with its label. Positioned against the group
   rather than handed to `ChipGroup`, whose label is a plain string today —
   when it grows a count slot this becomes one prop and the wrapper's
   `relative` goes with it.

   Keyed on the number so every change replays the arrival: a count only moves
   when a chip is tapped, so re-running it reads as confirmation — the exact
   opposite of the character counts on the typing screens, which animate once
   and then hold still because they move on every keystroke. Hidden from
   screen readers, which are already told the pressed state of the chip that
   changed and do not need it totalled back at them. */
/* Zero reads as nothing rather than as "0 picked": three groups each
   announcing a zero is clutter on a screen that is already the densest in the
   flow, and `undefined` is how ChipGroup is told to render no tally at all. */
function tally(count: number): number | undefined {
  return count > 0 ? count : undefined;
}

/* Two things a chip label has to carry that the shared `Chip` cannot.
   A 22px body, because the pill's own padding lands it at 34 and a tap target
   on a phone starts at 36. And the tick, which is positioned rather than
   inline: twenty chips in a wrap flow reflow if any one of them changes
   width, so a chip that has just been picked must occupy exactly the space it
   did a moment ago. A dot rather than a check because at this size a glyph
   inside a 6px circle is a smudge, and the pill has already turned. */
function ChipLabel({
  label,
  selected,
  badge,
}: {
  label: ReactNode;
  selected: boolean;
  badge?: ReactNode;
}) {
  return (
    <span className="relative inline-flex min-h-[1.375rem] items-center gap-1.5">
      {label}
      {badge}
      {selected ? (
        <span
          aria-hidden="true"
          className="animate-tc-tick absolute -top-1 -right-1.5 size-1.5 rounded-full bg-signal"
        />
      ) : null}
    </span>
  );
}

export function StepChannels({ draft, patch }: StepProps) {
  /* The widget is not really a choice — it is what a customer gets today — so
     it starts ticked rather than making them find the one live option in a
     list of nine. The ref is what makes this a default and not a policy: once
     they touch the group, we stop reinstating it, including if they clear it.
     Seeding runs off `draft.channels` rather than once on mount because the
     orchestrator loads the saved draft in its own effect, which lands after
     this one and would otherwise wipe the seed. */
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current || draft.channels.length > 0) return;
    patch({ channels: ['widget'] });
  }, [draft.channels, patch]);

  const toggleChannel = (id: string) => {
    touched.current = true;
    patch({ channels: toggle(draft.channels, id) });
  };

  return (
    <>
      <StepHeading
        title="Where should it answer?"
        description="The widget on your own site is what you get today. Tell us where else you would put this agent and we build in that order."
      />

      {/* Six blocks, and they arrive in reading order: the sentence that says
          nothing is connected has to land before the chips it is about, not
          alongside them. Tighter on a phone, where this screen is the longest
          in the flow and 24px between six blocks is a screen of air. */}
      <StepBody className="tc-stagger space-y-5 sm:space-y-6">
        {/* Mandatory and stated once, before any chip is within reach. A screen
            that takes a tick for Slack and then says nothing has promised
            Slack. The phrasing matches /embed word for word. */}
        <p className="tc-inset flex items-start gap-2.5 px-3.5 py-3 tc-meta text-muted-foreground">
          <Lineicons
            icon={Plug1Outlined}
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
            focusable="false"
          />
          <span>
            Nothing is connected during setup. The widget and the hosted page are the only channels
            that work today — everything else here is noted for later, and ticking it changes
            nothing in your accounts.
          </span>
        </p>

        <div role="group" aria-label="Channels that work today">
          <ChipGroup label="Ready today" count={tally(countIn(LIVE_CHANNELS, draft.channels))}>
            {LIVE_CHANNELS.map((channel) => {
              const selected = draft.channels.includes(channel.id);
              return (
                <Chip
                  key={channel.id}
                  icon={channel.icon}
                  multi
                  selected={selected}
                  onClick={() => toggleChannel(channel.id)}
                  label={
                    <ChipLabel
                      label={channel.label}
                      selected={selected}
                      badge={
                        <span className="tc-path rounded-full border border-success-border bg-success-soft px-1.5 py-px text-[0.6875rem] leading-4 text-success-ink">
                          Ready
                        </span>
                      }
                    />
                  }
                />
              );
            })}
          </ChipGroup>
        </div>

        {/* The recess is the whole point: nine chips that do nothing sit in a
            sunk tray, the two that work sit on the page. It is the surface the
            paragraph above already uses, so it adds no new treatment, and it
            lets the eye skip the roadmap in one movement instead of reading
            nine names to find out none of them are live. */}
        <div
          role="group"
          aria-label="Planned channels, not connected yet"
          className="tc-inset px-3.5 py-3"
        >
          <ChipGroup
            label="Planned · not connected yet"
            count={tally(countIn(PLANNED_CHANNELS, draft.channels))}
          >
            {PLANNED_CHANNELS.map((channel) => {
              const selected = draft.channels.includes(channel.id);
              return (
                <Chip
                  key={channel.id}
                  icon={channel.icon}
                  multi
                  selected={selected}
                  onClick={() => toggleChannel(channel.id)}
                  label={<ChipLabel label={channel.label} selected={selected} />}
                />
              );
            })}
          </ChipGroup>
        </div>

        <Hairline />

        <div role="group" aria-label="Tools you already run">
          <ChipGroup label="Tools you already run" count={tally(countIn(TOOLS, draft.tools))}>
            {TOOLS.map((tool) => {
              const selected = draft.tools.includes(tool.id);
              return (
                <Chip
                  key={tool.id}
                  icon={tool.icon}
                  multi
                  selected={selected}
                  onClick={() => patch({ tools: toggle(draft.tools, tool.id) })}
                  label={<ChipLabel label={tool.label} selected={selected} />}
                />
              );
            })}
          </ChipGroup>
          {/* Why we are asking, since this group does nothing visible. */}
          <p className="mt-3 tc-meta text-muted-foreground">
            This one is only so we know which integration to build first. Nothing is read from these
            tools and nothing is connected to them.
          </p>
        </div>

        {/* No button here: the frame owns Back and Continue. Saying it is
            optional is the only way to make skipping visible from inside. */}
        <p className="tc-path text-muted-foreground">
          Neither question is required — Continue works with nothing picked.
        </p>
      </StepBody>
    </>
  );
}
