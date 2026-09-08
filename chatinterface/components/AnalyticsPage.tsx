'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  ArrowRightOutlined,
  BarChart4Outlined,
  BotpressOutlined,
  Database2Outlined,
  Message2QuestionOutlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DeltaChip,
  EmptyState,
  ErrorState,
  Fact,
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
  Segmented,
  StatGrid,
  StatTile,
  TileSkeleton,
  compact,
  exact,
  plural,
} from '@/components/dashboard/kit';
import { useChartTheme } from '@/components/dashboard/chart-theme';
import { botId, excerpt, percent, relativeTime, seconds, shortDate, trendOf } from '@/lib/insights';
import type { Analytics, AnalyticsPoint } from '@/lib/types/analytics';
import type { AnalyticsPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Analytics  ·  /measure
   --------------------------------------------------------------------------
   Overview answers "what happened". This screen answers "why", which means it
   has to be narrower than Overview in scope and deeper in every other
   direction: one window, one chatbot or all of them, and then the things that
   explain the shape of the volume line.

   Three of those things are ledgers rather than charts, on purpose. A bar
   chart of ten question strings truncated to thirty characters tells you
   nothing — the wording *is* the data, because the wording is what retrieval
   has to match. So the questions, the gaps and the per-chatbot comparison are
   tables with a proportion bar in them, and the one genuine time series is the
   one chart on the page.

   The screen fetches its own slice because it owns the filters. The payload
   Overview already fetched is used as the first paint, so the default view has
   real numbers on it immediately instead of a skeleton the reader waits
   through twice.

   Answer rate needs its definition said out loud, and it is, in the tile note:
   a reply counts as answered when retrieval found something to answer from.
   Replies written before that was recorded are counted as unmeasured and left
   out of the ratio rather than quietly scored as wins.
   ========================================================================== */

const RANGES = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
] as const;

type RangeValue = (typeof RANGES)[number]['value'];

const DEFAULT_RANGE: RangeValue = '30';

const QUESTION_COLS = 'grid-cols-[1.75rem_minmax(0,1fr)_4rem]';
const BOT_COLS =
  'grid-cols-[minmax(0,1fr)_5rem_4.5rem] sm:grid-cols-[minmax(0,1fr)_6rem_5rem_5.5rem_6rem]';

type Question = { text: string; count: number; lastAskedAt?: string; chatbotId?: string };

function readQuestions(raw: unknown): Question[] {
  return (Array.isArray(raw) ? raw : [])
    .map((item: any) => ({
      text: String(item?.question ?? item?.questions ?? '').trim(),
      count: Number(item?.count) || 0,
      lastAskedAt: item?.lastAskedAt,
      chatbotId: item?.chatbotId ? String(item.chatbotId) : undefined,
    }))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => b.count - a.count);
}

/** The proportion bar used by all three ledgers. Sequential, one hue, no ramp. */
function Meter({ pct }: { pct: number }) {
  return (
    <span
      className="tc-meter mt-2 h-1"
      style={{ ['--tc-fill' as any]: `${Math.max(0, Math.min(100, pct))}%` }}
    >
      <span className="tc-meter-bar" />
    </span>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const value = Number(point.value);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2">
      <p className="tc-eyebrow">{shortDate(String(label))}</p>
      <p className="tc-num mt-0.5 font-mono text-[0.9375rem] text-foreground">
        {value.toLocaleString()}{' '}
        <span className="text-muted-foreground">{plural(value, 'message')}</span>
      </p>
      {point.payload?.conversations !== undefined ? (
        <p className="tc-path mt-0.5 text-muted-foreground">
          {exact(point.payload.conversations)}{' '}
          {plural(Number(point.payload.conversations) || 0, 'conversation')}
        </p>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage({
  analytics,
  chatbots,
  loading,
  onNavigate,
  onSelectChatbot,
}: AnalyticsPageProps) {
  const chart = useChartTheme();
  const bots = useMemo(() => (Array.isArray(chatbots) ? chatbots : []), [chatbots]);

  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const [scope, setScope] = useState<string>('all');

  /* The container's payload is the default view, so start with it rather than a
     skeleton. Any change of filter replaces it with a fetch of its own. */
  const [data, setData] = useState<Analytics | null>(analytics ?? null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(
    analytics ? 'ready' : 'loading',
  );

  const isDefaultView = scope === 'all' && range === DEFAULT_RANGE;
  /* A workspace with no chatbots gets the empty state and none of the zeros
     underneath it: rows of "0" read as a broken screen, not as a new account. */
  const noBots = !loading && bots.length === 0;
  const requestRef = useRef(0);

  useEffect(() => {
    if (isDefaultView && analytics && requestRef.current === 0) {
      setData(analytics);
      setState('ready');
    }
  }, [analytics, isDefaultView]);

  const load = useCallback(async () => {
    const ticket = ++requestRef.current;
    setState('loading');
    try {
      const params = new URLSearchParams({ days: range });
      if (scope !== 'all') params.set('chatbotId', scope);
      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (!response.ok) throw new Error(String(response.status));
      const next: Analytics = await response.json();
      if (ticket !== requestRef.current) return;
      setData(next);
      setState('ready');
    } catch {
      if (ticket !== requestRef.current) return;
      setState('error');
    }
  }, [range, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const series: AnalyticsPoint[] = useMemo(() => {
    const raw = data?.messagesOverTime ?? data?.messageOverTime ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const totals = data?.totals ?? null;
  const questions = useMemo(() => readQuestions(data?.topQuestions), [data]);
  const gaps = useMemo(() => readQuestions(data?.unansweredQuestions), [data]);
  const byChatbot = useMemo(
    () => (Array.isArray(data?.byChatbot) ? data!.byChatbot! : []),
    [data],
  );

  const trend = useMemo(() => trendOf(series as any), [series]);

  const busiest = useMemo(() => {
    if (series.length === 0) return null;
    return series.reduce((best, point) =>
      (Number(point.messages) || 0) > (Number(best.messages) || 0) ? point : best,
    );
  }, [series]);

  const dailyMean = useMemo(() => {
    if (series.length === 0 || !totals) return null;
    return Math.round((Number(totals.messages) || 0) / series.length);
  }, [series, totals]);

  const topCount = questions[0]?.count ?? 0;
  const topGap = gaps[0]?.count ?? 0;
  const busiestBot = byChatbot[0]?.messages ?? 0;
  const hasTraffic = Boolean(totals && Number(totals.messages) > 0);
  const scopedBot = useMemo(() => bots.find((bot) => botId(bot) === scope) ?? null, [bots, scope]);
  const measuredReplies = totals ? totals.answered + totals.unanswered : 0;

  function openKnowledge(chatbotId?: string) {
    const bot = chatbotId ? bots.find((item) => botId(item) === String(chatbotId)) : null;
    if (bot) onSelectChatbot?.(bot);
    onNavigate?.('knowledge');
  }

  const filters = (
    <>
      {bots.length > 1 ? (
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger
            className="h-8 w-full text-sm sm:w-52"
            aria-label="Scope to one chatbot"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chatbots</SelectItem>
            {bots.map((bot) => (
              <SelectItem key={botId(bot) ?? bot?.name} value={String(botId(bot))}>
                {bot?.name || 'Untitled chatbot'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Segmented
        size="sm"
        value={range}
        onChange={(next) => setRange(next as RangeValue)}
        options={RANGES.map((item) => ({ value: item.value, label: item.label }))}
      />
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="/measure"
        title="Analytics"
        description="Overview says what happened. This says why: which questions carried the traffic, which ones nothing in the index could answer, and which chatbot is doing the work."
        meta={
          <>
            <Fact label="scope" value={scopedBot ? scopedBot.name : 'all chatbots'} />
            <Fact label="window" value={`${range}d`} />
            <Fact
              label="questions tracked"
              value={state === 'loading' ? '—' : exact(questions.length)}
            />
          </>
        }
        actions={filters}
      />

      {state === 'error' ? (
        <ErrorState
          title="Could not load analytics"
          body="The figures request did not come back. Nothing was changed — try again."
          onRetry={load}
        />
      ) : null}

      {state === 'loading' && !totals && !noBots ? (
        <>
          <StatGrid>
            <TileSkeleton />
            <TileSkeleton />
            <TileSkeleton />
            <TileSkeleton />
          </StatGrid>
          <PanelSkeleton bodyHeight="h-72" />
        </>
      ) : null}

      {totals && !noBots ? (
        <div
          aria-busy={state === 'loading'}
          className={`space-y-8 ${state === 'loading' ? 'opacity-60 transition-opacity' : ''}`}
        >
          <StatGrid>
            <StatTile
              label={`Questions asked · ${range}d`}
              value={compact(totals.messages)}
              delta={trend}
              note={
                hasTraffic
                  ? `${exact(totals.conversations)} ${plural(totals.conversations, 'conversation')}`
                  : 'nothing logged in this window'
              }
            />
            <StatTile
              label="Answer rate"
              value={percent(totals.answerRate)}
              meter={
                totals.answerRate === null
                  ? undefined
                  : {
                      pct: Math.round(totals.answerRate * 100),
                      level: totals.answerRate >= 0.8 ? 'ok' : totals.answerRate >= 0.5 ? 'low' : 'empty',
                    }
              }
              note={
                totals.answerRate === null
                  ? 'not measured yet — a reply counts once we record whether it had knowledge behind it'
                  : `${exact(totals.answered)} of ${exact(measuredReplies)} replies had knowledge behind them`
              }
            />
            <StatTile
              label="Median reply time"
              value={seconds(totals.medianLatencyMs)}
              note={
                totals.medianLatencyMs === null
                  ? 'recorded from the next reply onward'
                  : 'wall clock, from question to answer'
              }
            />
            <StatTile
              label="Unanswered"
              value={exact(totals.unanswered)}
              note={
                totals.unanswered > 0
                  ? 'replies with nothing in the index behind them'
                  : 'every measured reply had a source'
              }
            >
              {totals.unanswered > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mt-auto justify-start gap-1.5 self-start"
                  onClick={() => onNavigate?.('inbox')}
                >
                  Read those threads
                  <Lineicons icon={ArrowRightOutlined} className="size-3.5" />
                </Button>
              ) : null}
            </StatTile>
          </StatGrid>

          <Panel>
            <PanelHeader
              eyebrow="/measure"
              title="Messages over time"
              description={
                series.length > 0
                  ? `Every day in the window, including the quiet ones — a gap in the line would read as missing data rather than as nobody asking.`
                  : undefined
              }
              action={trend ? <DeltaChip delta={trend} tone="neutral" /> : null}
            />
            <PanelBody>
              {series.length > 0 && hasTraffic ? (
                <ResponsiveContainer width="100%" height={272}>
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tc-messages" x1="0" y1="0" x2="0" y2="1">
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
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chart.axis }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
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
                      fill="url(#tc-messages)"
                      activeDot={{ r: 4, fill: chart.surface, stroke: chart.signal, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={BarChart4Outlined}
                  title="Nothing logged in this window"
                  body="Volume shows up here the same day the widget starts answering. Try a longer window, or put the snippet on your site."
                  action={
                    <Button variant="outline" onClick={() => onNavigate?.('deploy')}>
                      Get the snippet
                    </Button>
                  }
                />
              )}
            </PanelBody>
            {hasTraffic ? (
              <PanelFooter>
                <Fact label="busiest day" value={busiest ? shortDate(busiest.date) : '—'} />
                <Fact label="daily average" value={dailyMean === null ? '—' : exact(dailyMean)} />
                <Fact
                  label="active days"
                  value={`${exact(totals.activeDays)} of ${exact(series.length)}`}
                />
                <Fact label="last activity" value={relativeTime(totals.lastActiveAt)} />
              </PanelFooter>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="/index"
              title="Questions nothing covered"
              description="The bot was asked these and had no source to answer from. This is the shortest path to a better answer rate: each one is a page the index is missing."
              action={
                gaps.length > 0 ? (
                  <Mono className="text-muted-foreground">{exact(gaps.length)} to fix</Mono>
                ) : null
              }
            />
            <PanelBody className="px-3 sm:px-4">
              {gaps.length === 0 ? (
                <EmptyState
                  icon={Database2Outlined}
                  title={
                    totals.unmeasured > 0 && measuredReplies === 0
                      ? 'Not measured for this window'
                      : 'No gaps in this window'
                  }
                  body={
                    totals.unmeasured > 0 && measuredReplies === 0
                      ? 'These conversations were answered before we started recording whether a reply had knowledge behind it. New ones will show up here.'
                      : 'Every question in this window had something in the index behind the answer. Nothing to add.'
                  }
                />
              ) : (
                <RowList>
                  {gaps.map((item, index) => (
                    <Row key={`${item.text}-${index}`} className={`${QUESTION_COLS} items-start`}>
                      <span className="tc-num pt-0.5 tc-path text-warning">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block tc-body text-foreground">
                          {excerpt(item.text, 160)}
                        </span>
                        <Meter pct={topGap ? (item.count / topGap) * 100 : 0} />
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {item.lastAskedAt ? (
                            <Mono className="text-muted-foreground">
                              last asked {relativeTime(item.lastAskedAt)}
                            </Mono>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openKnowledge(item.chatbotId)}
                            className="tc-path rounded-sm text-signal transition-colors hover:text-signal-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            add a source →
                          </button>
                        </span>
                      </span>
                      <Mono className="pt-0.5 text-right">{exact(item.count)}</Mono>
                    </Row>
                  ))}
                </RowList>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="/answer"
              title="Top questions"
              description="Read the wording, not a truncated label — how people phrase a question is what the bot has to match."
            />
            <PanelBody className="px-3 sm:px-4">
              {questions.length === 0 ? (
                <EmptyState
                  icon={Message2QuestionOutlined}
                  title="Nothing asked yet"
                  body="Questions appear here as soon as visitors start using the chatbot, ranked by how often each one comes up."
                />
              ) : (
                <RowList>
                  {questions.map((item, index) => (
                    <Row key={`${item.text}-${index}`} className={`${QUESTION_COLS} items-start`}>
                      <span className="tc-num pt-0.5 tc-path text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block tc-body text-foreground">
                          {excerpt(item.text, 160)}
                        </span>
                        <Meter pct={topCount ? (item.count / topCount) * 100 : 0} />
                      </span>
                      <Mono className="pt-0.5 text-right">{exact(item.count)}</Mono>
                    </Row>
                  ))}
                </RowList>
              )}
            </PanelBody>
          </Panel>

          {scope === 'all' && byChatbot.length > 1 ? (
            <Panel>
              <PanelHeader
                eyebrow="/agents"
                title="By chatbot"
                description="Which bot is carrying the traffic, and whether it is answering well. A bot with no traffic still appears — that is usually the finding."
              />
              <PanelBody className="px-3 sm:px-4">
                <RowHead className={BOT_COLS}>
                  <span>Chatbot</span>
                  <span className="text-right">Messages</span>
                  <span className="text-right">Threads</span>
                  <span className="hidden text-right sm:block">Answer rate</span>
                  <span className="hidden text-right sm:block">Last active</span>
                </RowHead>
                <RowList>
                  {byChatbot.map((bot) => (
                    <Row key={bot.id} className={`${BOT_COLS} items-start`}>
                      <span className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setScope(String(bot.id))}
                          className="block max-w-full truncate rounded-sm text-left tc-label text-foreground transition-colors hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          {bot.name || 'Untitled chatbot'}
                        </button>
                        <Meter pct={busiestBot ? (bot.messages / busiestBot) * 100 : 0} />
                      </span>
                      <Mono className="text-right">{compact(bot.messages)}</Mono>
                      <Mono className="text-right">{exact(bot.conversations)}</Mono>
                      <Mono className="hidden text-right sm:block">{percent(bot.answerRate)}</Mono>
                      <Mono className="hidden text-right sm:block">
                        {relativeTime(bot.lastActiveAt)}
                      </Mono>
                    </Row>
                  ))}
                </RowList>
              </PanelBody>
              <PanelFooter>
                <span className="tc-meta text-muted-foreground">
                  Pick one above to scope every figure on this page to it.
                </span>
              </PanelFooter>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {noBots ? (
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={BotpressOutlined}
              title="No chatbots to measure"
              body="Analytics reads the conversations your chatbots have had. Create one, put it on your site, and this screen fills in on its own."
              action={<Button onClick={() => onNavigate?.('chatbots')}>Create a chatbot</Button>}
            />
          </PanelBody>
        </Panel>
      ) : null}
    </>
  );
}
