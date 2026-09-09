'use client';

import { useMemo } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { ArrowRightOutlined, BotpressOutlined, Plug1Outlined } from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  Fact,
  FutureTile,
  Hairline,
  LiveTag,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  RowList,
  exact,
} from '@/components/dashboard/kit';
import {
  INTEGRATION_GROUPS,
  INTEGRATIONS,
  integrationsIn,
  type Integration,
} from '@/lib/integrations';
import { hostOf } from '@/lib/insights';
import type { IntegrationsPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Integrations  ·  /connect
   --------------------------------------------------------------------------
   The index of every connection, in one place, grouped by direction: how
   customers reach the bot, where its answers come from, where a question goes
   when it cannot answer, and what it can trigger in your own tools.

   The screen holds no controls of its own. Every live connection already has
   an owner — the embed snippet lives on Deploy, the crawl lives on Knowledge —
   and duplicating those controls here would give the product two places to
   change the same thing. So a live row is a signpost with the real artefact on
   it, and the roadmap sits beneath at reduced contrast rather than hidden.

   Everything below is rendered from `lib/integrations.ts`. Shipping a provider
   is a data change: flip `status` to `live` and give it a `page`.
   ========================================================================== */

const LIVE_COUNT = INTEGRATIONS.filter((item) => item.status === 'live').length;
const PLANNED_COUNT = INTEGRATIONS.length - LIVE_COUNT;

const COLS = 'grid-cols-[2rem_minmax(0,1fr)_auto]';

export default function IntegrationsPage({
  chatbots,
  selectedChatbot,
  loading,
  onNavigate,
}: IntegrationsPageProps) {
  const bots = useMemo(() => (Array.isArray(chatbots) ? chatbots : []), [chatbots]);
  const hasBots = bots.length > 0;

  /* A per-chatbot connection is only meaningful once there is a chatbot, and
     the reader should be told whose it is. With none, the row still shows —
     the answer to "do you support a widget" does not depend on my account —
     but its action sends them to create one instead of to an empty screen. */
  const scope = selectedChatbot?.name
    ? `${selectedChatbot.name}${hostOf(selectedChatbot) ? ` · ${hostOf(selectedChatbot)}` : ''}`
    : null;

  function LiveRow({ item }: { item: Integration }) {
    return (
      <Row className={`${COLS} items-center`}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
          <Lineicons
            icon={item.icon}
            size={15}
            className="text-muted-foreground"
            aria-hidden="true"
            focusable="false"
          />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tc-label text-foreground">
              {item.name}
            </span>
            <LiveTag label="Connected" />
            {item.detail ? <Mono className="text-muted-foreground">{item.detail}</Mono> : null}
          </span>
          <span className="mt-0.5 block tc-meta text-muted-foreground">
            {item.note}
            {item.perChatbot && scope ? (
              <>
                {' '}
                <span className="tc-path text-muted-foreground">— {scope}</span>
              </>
            ) : null}
          </span>
        </span>
        {hasBots ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onNavigate?.(item.page ?? 'deploy')}
          >
            Open
            <Lineicons icon={ArrowRightOutlined} className="size-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('chatbots')}>
            Needs a chatbot
          </Button>
        )}
      </Row>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="/connect"
        title="Integrations"
        description="Where this workspace is reachable, where its answers come from, and what it can reach back into. Anything marked planned is not built yet — it will appear here as a real control the day it is."
        meta={
          <>
            <Fact label="connected" value={exact(LIVE_COUNT)} tone="signal" />
            <Fact label="planned" value={exact(PLANNED_COUNT)} />
            <Fact label="chatbots" value={loading ? '—' : exact(bots.length)} />
          </>
        }
      />

      {!loading && !hasBots ? (
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={BotpressOutlined}
              title="Nothing to connect yet"
              body="Connections attach to a chatbot — its widget, its knowledge, its endpoint. Create one and every row below becomes something you can turn on."
              action={<Button onClick={() => onNavigate?.('chatbots')}>Create a chatbot</Button>}
            />
          </PanelBody>
        </Panel>
      ) : null}

      {INTEGRATION_GROUPS.map((group) => {
        const items = integrationsIn(group.id);
        const live = items.filter((item) => item.status === 'live');
        const planned = items.filter((item) => item.status === 'planned');

        return (
          <Panel key={group.id}>
            <PanelHeader
              eyebrow={group.label}
              title={group.description}
              action={
                <Mono className="text-muted-foreground">
                  {live.length > 0 ? `${exact(live.length)} live · ` : ''}
                  {exact(planned.length)} planned
                </Mono>
              }
            />
            <PanelBody className="space-y-4 px-3 sm:px-4">
              {live.length > 0 ? (
                <RowList>
                  {live.map((item) => (
                    <LiveRow key={item.id} item={item} />
                  ))}
                </RowList>
              ) : (
                <p className="px-2 tc-meta text-muted-foreground">
                  Nothing here is connected yet. These are the ones we are building.
                </p>
              )}

              {live.length > 0 && planned.length > 0 ? <Hairline /> : null}

              {planned.length > 0 ? (
                <div className="grid gap-3.5 px-2 pb-1 sm:grid-cols-2 xl:grid-cols-3">
                  {planned.map((item) => (
                    <FutureTile
                      key={item.id}
                      icon={item.icon}
                      name={item.name}
                      note={item.note}
                    />
                  ))}
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        );
      })}

      <Panel>
        <PanelHeader
          eyebrow="Missing something"
          title="Ask for the one you need"
          description="The order above is a guess at what matters most. Tell us which connection would change how you use this and it moves up."
          action={
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href="mailto:hello@turbochat.live?subject=Integration%20request">
                <Lineicons icon={Plug1Outlined} className="size-3.5" />
                Request an integration
              </a>
            </Button>
          }
        />
      </Panel>
    </>
  );
}
