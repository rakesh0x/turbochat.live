'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRightOutlined,
  BarChart4Outlined,
  Comment1TextOutlined,
  Envelope1Outlined,
  Globe1Outlined,
  PlayOutlined,
  Rocket5Outlined,
  Spinner3Outlined,
  XmarkCircleOutlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import {
  DeltaChip,
  EmptyState,
  ErrorState,
  Fact,
  KeyValue,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  PanelSkeleton,
  Row,
  RowHead,
  RowList,
  RowsSkeleton,
  StatGrid,
  StatTile,
  StatusPill,
  TileSkeleton,
  compact,
  exact,
  plural,
} from '@/components/dashboard/kit';
import { UpgradePlate, formatHours, hoursSaved, readCredits } from '@/components/dashboard/upsell';
import { useChartTheme } from '@/components/dashboard/chart-theme';
import {
  excerpt,
  hostOf,
  isFailed,
  isLive,
  isWorking,
  percent,
  relativeTime,
  seconds,
  shortDate,
  trendOf,
  type Point,
} from '@/lib/insights';
import type { ConversationList, ConversationSummary } from '@/lib/types/analytics';
import type { DashboardPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Overview  ·  /overview
   --------------------------------------------------------------------------
   Four identical stat cards in a row is the house style of every generated
   dashboard, and it flattens the very thing a reader came for: one of those
   numbers matters more than the others. So the volume figure gets a panel and
   a chart, effectiveness gets a column beside it, and the merely useful counts
   drop to a tile row underneath.

   The screen is ordered as a set of questions, in the order they get asked
   after logging in: does anything need me, how much is this being used, is it
   answering well, what did customers actually say, and which bot is doing the
   work. "Does anything need me" comes first because it is the only one with an
   action attached, and it is assembled from real state — a failed crawl, a
   thread the bot could not answer, an address someone typed into the chat, a
   trained bot with no traffic. When none of those are true the panel says so
   in one line rather than disappearing, because "nothing needs you" is itself
   the answer to the question.

   Two things were removed rather than restyled. `PLACEHOLDER_VOLUME` and
   `PLACEHOLDER_WEEKLY` filled the charts with invented traffic whenever the
   real series was empty, so a brand-new account saw a busy month it never
   had. And the old hard redirect to `/onboarding` meant a customer with no
   chatbots never saw this screen at all; now it greets them.

   The date, host, status and trend helpers used to be defined here and again
   in two other screens. They live in `lib/insights.ts` now: three screens
   disagreeing about which statuses count as "answering" was a real bug, not a
   tidiness problem.
   ========================================================================== */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2">
      <p className="tc-eyebrow">{shortDate(String(label))}</p>
      <p className="tc-num mt-0.5 font-mono text-[0.9375rem] text-foreground">
        {value.toLocaleString()}{' '}
        <span className="text-muted-foreground">{plural(value, 'message')}</span>
      </p>
    </div>
  );
}

/* ---- first run ------------------------------------------------------------
   What a new account sees instead of being bounced to /onboarding. Three
   steps, numbered, in the order the product actually works — and the counts
   stay off the screen entirely, because every one of them would be zero. */
function FirstRun({ onCreate, canCreate }: { onCreate?: () => void; canCreate: boolean }) {
  const steps = [
    {
      icon: Globe1Outlined,
      title: 'Point it at your site',
      body: 'Give us a URL and we read the pages, or upload the PDFs and docs you already have.',
    },
    {
      icon: PlayOutlined,
      title: 'Ask it something hard',
      body: 'The playground shows you which source every answer came from, so you can see what it knows before anyone else does.',
    },
    {
      icon: Rocket5Outlined,
      title: 'Embed one script tag',
      body: 'Copy the snippet into your site and the widget is live. No deploy, no rebuild.',
    },
  ];

  return (
    <Panel>
      <PanelHeader
        eyebrow="/start"
        title="Your first chatbot"
        description="Three steps, about five minutes. Nothing here needs a card."
      />
      <PanelBody className="space-y-0 p-0">
        <ol className="divide-y divide-border">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 px-6 py-5 sm:px-7">
              <span className="tc-num mt-0.5 shrink-0 tc-path text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2">
                <Lineicons icon={step.icon} className="size-4 text-signal" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{step.title}</span>
                <span className="mt-1 block max-w-prose tc-body text-muted-foreground">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </PanelBody>
      <PanelFooter>
        <Button onClick={onCreate} disabled={!canCreate} className="gap-2">
          Create your first chatbot
          <Lineicons icon={ArrowRightOutlined} className="size-3.5" />
        </Button>
        <span className="tc-meta text-muted-foreground">
          {canCreate ? 'Takes a URL and a name.' : 'Add credits to create a chatbot.'}
        </span>
      </PanelFooter>
    </Panel>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <PanelSkeleton bodyHeight="h-20" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <PanelSkeleton bodyHeight="h-64" />
        <PanelSkeleton bodyHeight="h-40" />
      </div>
      <StatGrid>
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
      </StatGrid>
    </>
  );
}

/* ---- needs you ------------------------------------------------------------
   One row per thing a reader can actually do something about. `tone` only
   changes the icon tile, never the row: a list where every item shouts is a
   list nobody reads. Items are built in urgency order and the list is capped,
   because a panel with eleven rows in it is a second inbox. */
type Attention = {
  id: string;
  tone: 'urgent' | 'signal' | 'quiet';
  icon: any;
  title: string;
  body: string;
  cta?: string;
  onAct?: () => void;
};

const TONES: Record<Attention['tone'], string> = {
  urgent: 'border-danger-border bg-danger-soft text-danger',
  signal: 'border-signal-border bg-signal-soft text-signal',
  quiet: 'border-border bg-surface-2 text-muted-foreground',
};

function AttentionRow({ item }: { item: Attention }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4 sm:px-7">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${TONES[item.tone]}`}
      >
        <Lineicons icon={item.icon} className="size-4" />
      </span>
      <span className="min-w-[14rem] flex-1">
        <span className="block tc-label text-foreground">
          {item.title}
        </span>
        <span className="mt-0.5 block tc-meta text-muted-foreground">
          {item.body}
        </span>
      </span>
      {item.cta && item.onAct ? (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={item.onAct}>
          {item.cta}
          <Lineicons icon={ArrowRightOutlined} className="size-3.5" />
        </Button>
      ) : null}
    </li>
  );
}

export default function DashboardPage({
  stats,
  chatbots,
  loading,
  canCreateChatbot,
  onCreateChatbot,
  userProfile,
  analytics,
  onNavigate,
  onSelectChatbot,
}: DashboardPageProps) {
  const chart = useChartTheme();
  const credits = useMemo(() => readCredits(userProfile), [userProfile]);

  const bots = useMemo(() => (Array.isArray(chatbots) ? chatbots : []), [chatbots]);

  /* The inbox slice this screen needs is small and nobody else has fetched it:
     the six most recent threads, plus the two counts the attention panel reads.
     It is deliberately not fatal — the rest of Overview is useful without it,
     so a failure shows up inside the one panel that depends on it. */
  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [inbox, setInbox] = useState<ConversationList['counts'] | null>(null);
  const [inboxState, setInboxState] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadInbox = useCallback(async () => {
    setInboxState('loading');
    try {
      const response = await fetch('/api/conversations?days=30&limit=6');
      if (!response.ok) throw new Error(String(response.status));
      const payload: ConversationList = await response.json();
      setThreads(Array.isArray(payload?.conversations) ? payload.conversations : []);
      setInbox(payload?.counts ?? null);
      setInboxState('ready');
    } catch {
      setInboxState('error');
    }
  }, []);

  useEffect(() => {
    if (bots.length === 0) return;
    void loadInbox();
  }, [bots.length, loadInbox]);

  const series: Point[] = useMemo(() => {
    const raw = analytics?.messagesOverTime ?? analytics?.messageOverTime ?? [];
    return (Array.isArray(raw) ? raw : []).slice(-30);
  }, [analytics]);

  const totals = analytics?.totals ?? null;

  const figures = useMemo(() => {
    const totalMessages = Number(stats?.totalMessages) || 0;
    const pagesRead = Number(stats?.totalPages) || 0;
    const live = bots.filter(isLive).length;
    const working = bots.filter(isWorking);
    const failed = bots.filter(isFailed);
    const windowed = series.reduce((sum, point) => sum + (Number(point.messages) || 0), 0);
    const peak = series.length
      ? series.reduce((best, point) =>
          (Number(point.messages) || 0) > (Number(best.messages) || 0) ? point : best,
        )
      : null;
    return { totalMessages, pagesRead, live, working, failed, windowed, peak };
  }, [stats, bots, series]);

  const trend = useMemo(() => trendOf(series), [series]);

  /* Ranked by traffic, because the question this panel answers is "which of
     these is actually carrying the load" — not "which did I make first". */
  const ranked = useMemo(
    () =>
      [...bots]
        .sort((a, b) => (Number(b?.monthlyMessages) || 0) - (Number(a?.monthlyMessages) || 0))
        .slice(0, 5),
    [bots],
  );

  const hasSeries = series.length > 0;
  const undeployed = bots.length > 0 && figures.totalMessages === 0;
  const measured = totals ? totals.answered + totals.unanswered : 0;

  function open(bot: any) {
    onSelectChatbot?.(bot);
    onNavigate?.('playground');
  }

  function fix(bot: any) {
    onSelectChatbot?.(bot);
    onNavigate?.('knowledge');
  }

  /* Built in urgency order: something broke, something went unanswered,
     nothing is deployed, somebody left an address, something is still
     working. Only the first four are shown. */
  const attention = useMemo<Attention[]>(() => {
    const items: Attention[] = [];

    if (figures.failed.length > 0) {
      const first = figures.failed[0];
      items.push({
        id: 'failed',
        tone: 'urgent',
        icon: XmarkCircleOutlined,
        title:
          figures.failed.length === 1
            ? `${first?.name || 'A chatbot'} could not finish reading`
            : `${figures.failed.length} chatbots could not finish reading`,
        body: 'Nothing was indexed, so it has no answers to give. Check the source URL and run it again.',
        cta: 'Open knowledge',
        onAct: () => fix(first),
      });
    }

    if (inbox && inbox.unanswered > 0) {
      items.push({
        id: 'unanswered',
        tone: 'signal',
        icon: Comment1TextOutlined,
        title: `${exact(inbox.unanswered)} ${plural(inbox.unanswered, 'conversation')} the bot could not answer`,
        body: 'Read what was asked, then add the missing page. This is the fastest way to move the answer rate.',
        cta: 'Open inbox',
        onAct: () => onNavigate?.('inbox'),
      });
    }

    if (undeployed) {
      items.push({
        id: 'undeployed',
        tone: 'signal',
        icon: Rocket5Outlined,
        title: 'Nothing has asked it a question yet',
        body: 'The chatbot is trained. It starts answering the moment the widget is on your site.',
        cta: 'Get the snippet',
        onAct: () => onNavigate?.('deploy'),
      });
    }

    if (inbox && inbox.contacts > 0) {
      items.push({
        id: 'contacts',
        tone: 'signal',
        icon: Envelope1Outlined,
        title: `${exact(inbox.contacts)} ${plural(inbox.contacts, 'person', 'people')} left an email address`,
        body: 'They typed it into the chat themselves. Nobody has replied from here — that is still on you.',
        cta: 'See who',
        onAct: () => onNavigate?.('inbox'),
      });
    }

    if (figures.working.length > 0) {
      items.push({
        id: 'working',
        tone: 'quiet',
        icon: Spinner3Outlined,
        title: `${exact(figures.working.length)} ${plural(figures.working.length, 'chatbot')} still reading`,
        body: 'Indexing runs on our side. Answers get better as pages land — no action needed.',
        cta: 'Watch progress',
        onAct: () => fix(figures.working[0]),
      });
    }

    return items.slice(0, 4);
  }, [figures.failed, figures.working, inbox, undeployed, onNavigate]);

  return (
    <>
      <PageHeader
        eyebrow="/overview"
        title={userProfile?.name ? `Welcome back, ${String(userProfile.name).split(' ')[0]}` : 'Overview'}
        description="Where your chatbots stand right now — what they have read, what they have been asked, and what is left to do."
        meta={
          <>
            <Fact label="chatbots" value={exact(bots.length)} />
            <Fact label="pages read" value={compact(figures.pagesRead)} />
            <Fact label="plan" value={credits.plan} />
          </>
        }
        actions={
          bots.length > 0 ? (
            <Button variant="outline" onClick={onCreateChatbot} disabled={!canCreateChatbot}>
              New chatbot
            </Button>
          ) : null
        }
      />

      {loading ? (
        <OverviewSkeleton />
      ) : bots.length === 0 ? (
        <FirstRun onCreate={onCreateChatbot} canCreate={canCreateChatbot} />
      ) : (
        <>
          <Panel>
            <PanelHeader
              eyebrow="/attention"
              title="Needs you"
              description="Assembled from what your chatbots and conversations actually did. Nothing here is a reminder you set."
              action={
                attention.length > 0 ? (
                  <Mono className="text-muted-foreground">
                    {exact(attention.length)} {plural(attention.length, 'item')}
                  </Mono>
                ) : null
              }
            />
            <PanelBody className="space-y-0 p-0">
              <ul className="divide-y divide-border">
                {attention.length > 0 ? (
                  attention.map((item) => <AttentionRow key={item.id} item={item} />)
                ) : (
                  <AttentionRow
                    item={{
                      id: 'clear',
                      tone: 'quiet',
                      icon: Comment1TextOutlined,
                      title: 'Nothing needs you right now',
                      body: `Every chatbot is answering, and no conversation in the last 30 days went unanswered.${
                        inboxState === 'error' ? ' Conversation checks could not be loaded.' : ''
                      }`,
                    }}
                  />
                )}
              </ul>
            </PanelBody>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHeader
                eyebrow="/measure"
                title="Message volume"
                description={
                  hasSeries
                    ? `Last ${series.length} ${plural(series.length, 'day')}.`
                    : 'Counted from logged conversations.'
                }
                action={trend ? <DeltaChip delta={trend} /> : null}
              />
              <PanelBody>
                <p className="flex items-baseline gap-2">
                  <span className="tc-figure tc-num">{compact(hasSeries ? figures.windowed : undefined)}</span>
                  <span className="tc-meta text-muted-foreground">
                    {plural(figures.windowed, 'message')}
                  </span>
                </p>
                {hasSeries ? (
                  <ResponsiveContainer width="100%" height={196} className="mt-4">
                    <AreaChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tc-overview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chart.signal} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={chart.signal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 11, fill: chart.axis }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chart.axis }}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: chart.axis, strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        stroke={chart.signal}
                        strokeWidth={2}
                        fill="url(#tc-overview)"
                        activeDot={{ r: 4, fill: chart.surface, stroke: chart.signal, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      icon={BarChart4Outlined}
                      title="No conversations logged yet"
                      body="Volume appears here the same day the widget goes live."
                    />
                  </div>
                )}
              </PanelBody>
              <PanelFooter className="justify-between">
                <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Fact label="all time" value={compact(figures.totalMessages)} />
                  <Fact
                    label="busiest day"
                    value={figures.peak ? shortDate(figures.peak.date) : '—'}
                  />
                  <Fact label="hours saved" value={formatHours(hoursSaved(figures.totalMessages))} />
                </span>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('analytics')}>
                  Why
                </Button>
              </PanelFooter>
            </Panel>

            <div className="space-y-6">
              <Panel>
                <PanelHeader
                  eyebrow="/measure"
                  title="Answering well?"
                  description="A reply counts as answered when the bot had a source behind it."
                />
                <PanelBody>
                  <p className="flex items-baseline gap-2">
                    <span className="tc-figure tc-num">{percent(totals?.answerRate ?? null)}</span>
                    <span className="tc-meta text-muted-foreground">answer rate</span>
                  </p>
                  <span
                    className="tc-meter mt-3"
                    data-level={
                      !totals || totals.answerRate === null
                        ? 'empty'
                        : totals.answerRate >= 0.8
                          ? 'ok'
                          : totals.answerRate >= 0.5
                            ? 'low'
                            : 'empty'
                    }
                    style={{
                      ['--tc-fill' as any]: `${Math.round((totals?.answerRate ?? 0) * 100)}%`,
                    }}
                  >
                    <span className="tc-meter-bar" />
                  </span>
                  <KeyValue
                    className="mt-4"
                    items={[
                      { label: 'Had a source', value: exact(totals?.answered), mono: true },
                      { label: 'Had nothing', value: exact(totals?.unanswered), mono: true },
                      { label: 'Median reply', value: seconds(totals?.medianLatencyMs), mono: true },
                      {
                        label: 'Chatbots answering',
                        value: `${figures.live} of ${bots.length}`,
                        mono: true,
                      },
                    ]}
                  />
                  {totals && measured === 0 ? (
                    <p className="mt-3 tc-meta text-muted-foreground">
                      {totals.unmeasured > 0
                        ? `${exact(totals.unmeasured)} ${plural(totals.unmeasured, 'reply', 'replies')} came before we started recording this, so they are left out of the rate rather than counted as wins.`
                        : 'Nothing measured in this window yet.'}
                    </p>
                  ) : null}
                </PanelBody>
                <PanelFooter>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate?.('analytics')}>
                    See what went unanswered
                  </Button>
                </PanelFooter>
              </Panel>

              <UpgradePlate
                state={credits}
                messages={figures.totalMessages}
                pagesRead={figures.pagesRead}
              />
            </div>
          </div>

          <StatGrid>
            <StatTile
              label="Conversations · 30d"
              value={compact(totals?.conversations)}
              note={
                totals
                  ? `${exact(totals.messages)} ${plural(totals.messages, 'message')} across them`
                  : 'from logged threads'
              }
            />
            <StatTile
              label="Answering"
              value={exact(figures.live)}
              note={
                figures.working.length > 0
                  ? `${figures.working.length} still indexing`
                  : `of ${bots.length} ${plural(bots.length, 'chatbot')}`
              }
            />
            <StatTile
              label="Pages indexed"
              value={compact(figures.pagesRead)}
              note="across every source"
            />
            <StatTile
              label="Support time saved"
              value={formatHours(hoursSaved(figures.totalMessages))}
              note="at four minutes a ticket"
            />
          </StatGrid>

          <Panel>
            <PanelHeader
              eyebrow="/inbox"
              title="Recent conversations"
              description="What customers actually typed. The wording is the useful part — a count never tells you what to fix."
              action={
                inbox ? (
                  <Mono className="text-muted-foreground">
                    {exact(inbox.all)} in 30d
                  </Mono>
                ) : null
              }
            />
            <PanelBody className="px-3 sm:px-4">
              {inboxState === 'loading' ? (
                <RowsSkeleton rows={4} />
              ) : inboxState === 'error' ? (
                <ErrorState
                  title="Could not load conversations"
                  body="Everything else on this screen is still accurate — only this list failed."
                  onRetry={loadInbox}
                />
              ) : threads.length === 0 ? (
                <EmptyState
                  icon={Comment1TextOutlined}
                  title="No conversations yet"
                  body="Every message a visitor sends is kept here, with the answer the bot gave and whether it had a source for it."
                  action={
                    <Button variant="outline" onClick={() => onNavigate?.('deploy')}>
                      Get the snippet
                    </Button>
                  }
                  secondary={
                    <Button variant="ghost" onClick={() => onNavigate?.('playground')}>
                      Test it yourself
                    </Button>
                  }
                />
              ) : (
                <RowList>
                  {threads.map((thread) => (
                    <Row
                      key={thread.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onNavigate?.('inbox')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onNavigate?.('inbox');
                        }
                      }}
                      className="cursor-pointer grid-cols-[minmax(0,1fr)_4.5rem] items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_7rem_5rem_4.5rem]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate tc-body text-foreground">
                          {thread.opener ? excerpt(thread.opener, 120) : 'No opening message'}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {thread.unanswered ? (
                            <span className="rounded-full border border-warning-border bg-warning-soft px-1.5 py-px tc-micro text-warning">
                              no knowledge
                            </span>
                          ) : null}
                          {thread.contactEmail ? (
                            <span className="inline-flex max-w-full items-center gap-1 truncate tc-micro text-muted-foreground">
                              <Lineicons icon={Envelope1Outlined} className="size-3 shrink-0" />
                              {thread.contactEmail}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <Mono className="hidden truncate sm:block">
                        {thread.chatbotName || 'chatbot'}
                      </Mono>
                      <Mono className="hidden text-right sm:block">
                        {exact(thread.messages)} msg
                      </Mono>
                      <Mono className="text-right">{relativeTime(thread.lastActiveAt)}</Mono>
                    </Row>
                  ))}
                </RowList>
              )}
            </PanelBody>
            {threads.length > 0 ? (
              <PanelFooter className="justify-between">
                <span className="tc-meta text-muted-foreground">
                  Newest first, across every chatbot.
                </span>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('inbox')}>
                  Open inbox
                </Button>
              </PanelFooter>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="/agents"
              title="Your chatbots"
              description="Ranked by traffic this month. Open one to ask it something."
            />
            <PanelBody className="px-3 sm:px-4">
              <RowHead className="grid-cols-[minmax(0,1fr)_6rem_5.5rem] sm:grid-cols-[minmax(0,1fr)_7rem_6rem_5rem]">
                <span>Chatbot</span>
                <span>Status</span>
                <span className="text-right">Messages</span>
                <span className="hidden text-right sm:block">Pages</span>
              </RowHead>
              <RowList>
                {ranked.map((bot, index) => (
                  <Row
                    key={bot?.id ?? bot?._id ?? index}
                    role="button"
                    tabIndex={0}
                    onClick={() => open(bot)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        open(bot);
                      }
                    }}
                    className="cursor-pointer grid-cols-[minmax(0,1fr)_6rem_5.5rem] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_5rem]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate tc-label text-foreground">
                        {bot?.name || 'Untitled chatbot'}
                      </span>
                      <span className="mt-0.5 block truncate tc-micro text-muted-foreground">
                        {hostOf(bot) || 'no source yet'}
                      </span>
                    </span>
                    <span>
                      <StatusPill status={bot?.status} />
                    </span>
                    <Mono className="text-right">{compact(Number(bot?.monthlyMessages) || 0)}</Mono>
                    <Mono className="hidden text-right sm:block">
                      {compact(Number(bot?.pagesScraped) || 0)}
                    </Mono>
                  </Row>
                ))}
              </RowList>
            </PanelBody>
            {bots.length > ranked.length ? (
              <PanelFooter className="justify-between">
                <span className="tc-meta text-muted-foreground">
                  Showing {ranked.length} of {bots.length}.
                </span>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('chatbots')}>
                  View all
                </Button>
              </PanelFooter>
            ) : null}
          </Panel>
        </>
      )}
    </>
  );
}
