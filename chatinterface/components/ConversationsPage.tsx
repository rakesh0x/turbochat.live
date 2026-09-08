'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  ArrowRightOutlined,
  BotpressOutlined,
  Comment1TextOutlined,
  Envelope1Outlined,
  Spinner3Outlined,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  EmptyState,
  ErrorState,
  Fact,
  Hairline,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  Row,
  RowHead,
  RowList,
  RowsSkeleton,
  Segmented,
  Toolbar,
  exact,
  plural,
} from '@/components/dashboard/kit';
import { botId, excerpt, relativeTime, seconds } from '@/lib/insights';
import type {
  ConversationList,
  ConversationSummary,
  ConversationTranscript,
} from '@/lib/types/analytics';
import type { ConversationsPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Conversations  ·  /inbox
   --------------------------------------------------------------------------
   The `messages` table has been written since the first chatbot shipped and
   never once displayed. This screen is that table, read as threads: what a
   customer asked, what the bot said, and whether it had anything to answer
   from. Everything else in the console is an aggregate of this.

   Three tabs, because they are the three reasons to open an inbox: everything,
   the threads where the bot came up empty, and the threads where somebody left
   an address. "Contacts" is deliberately not called Leads — nothing here was
   qualified, and there is no lead form in the widget. It is an email address a
   visitor typed into a chat, detected server-side, and labelled as exactly
   that.

   The screen fetches its own slice because it owns its own filters. The tab
   counts come back with the list from the same window, so switching tabs can
   never show a number the rows then contradict.
   ========================================================================== */

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'contacts', label: 'Contacts' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const RANGES = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
] as const;

type RangeValue = (typeof RANGES)[number]['value'];

const PAGE_SIZE = 25;

const COLS =
  'grid-cols-[minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,1fr)_5rem_5.5rem_6.5rem_2.25rem]';

const EMPTY_COUNTS = { all: 0, unanswered: 0, contacts: 0 };

export default function ConversationsPage({
  chatbots,
  onNavigate,
  onSelectChatbot,
}: ConversationsPageProps) {
  const bots = useMemo(() => (Array.isArray(chatbots) ? chatbots : []), [chatbots]);

  const [tab, setTab] = useState<TabValue>('all');
  const [range, setRange] = useState<RangeValue>('30');
  /* 'all' rather than null so the Select always has a value to render. The
     inbox is workspace-scoped on purpose: "did anything go unanswered today" is
     a question about the account, not about whichever bot the switcher happens
     to be pointing at. */
  const [scope, setScope] = useState<string>('all');

  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paging, setPaging] = useState(false);

  const [openThread, setOpenThread] = useState<ConversationSummary | null>(null);
  const [transcript, setTranscript] = useState<ConversationTranscript | null>(null);
  const [transcriptState, setTranscriptState] = useState<'loading' | 'ready' | 'error'>('loading');

  /* Filters change faster than requests come back. Without this, a slow "all"
     response can land after a fast "unanswered" one and repopulate the list
     with rows the current tab excludes. */
  const requestRef = useRef(0);

  const query = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({
        status: tab,
        days: range,
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (scope !== 'all') params.set('chatbotId', scope);
      return `/api/conversations?${params.toString()}`;
    },
    [tab, range, scope],
  );

  const load = useCallback(async () => {
    const ticket = ++requestRef.current;
    setState('loading');
    try {
      const response = await fetch(query(0));
      if (!response.ok) throw new Error(String(response.status));
      const data: ConversationList = await response.json();
      if (ticket !== requestRef.current) return;
      setRows(Array.isArray(data?.conversations) ? data.conversations : []);
      setCounts(data?.counts ?? EMPTY_COUNTS);
      setHasMore(Boolean(data?.hasMore));
      setState('ready');
    } catch {
      if (ticket !== requestRef.current) return;
      setState('error');
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    const ticket = requestRef.current;
    setPaging(true);
    try {
      const response = await fetch(query(rows.length));
      if (!response.ok) throw new Error(String(response.status));
      const data: ConversationList = await response.json();
      if (ticket !== requestRef.current) return;
      setRows((current) => [...current, ...(data?.conversations ?? [])]);
      setHasMore(Boolean(data?.hasMore));
    } catch {
      /* The rows already on screen are still valid; only the next page failed.
         Replacing the list with an error state would be a worse trade. */
    } finally {
      setPaging(false);
    }
  }, [query, rows.length]);

  const openTranscript = useCallback(async (thread: ConversationSummary) => {
    setOpenThread(thread);
    setTranscript(null);
    setTranscriptState('loading');
    try {
      const params = new URLSearchParams({ chatbotId: String(thread.chatbotId) });
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(thread.id)}?${params.toString()}`,
      );
      if (!response.ok) throw new Error(String(response.status));
      setTranscript(await response.json());
      setTranscriptState('ready');
    } catch {
      setTranscriptState('error');
    }
  }, []);

  const tabOptions = TABS.map((item) => ({
    value: item.value,
    label: `${item.label} ${exact(counts[item.value])}`,
  }));

  const scopedBot = useMemo(
    () => bots.find((bot) => botId(bot) === scope) ?? null,
    [bots, scope],
  );

  return (
    <>
      <PageHeader
        eyebrow="/inbox"
        title="Conversations"
        description="Every thread a customer started, newest first. Open one to read what the bot actually said."
        meta={
          <>
            <Fact label="threads" value={state === 'loading' ? '—' : exact(counts.all)} />
            <Fact
              label="unanswered"
              value={state === 'loading' ? '—' : exact(counts.unanswered)}
              tone={counts.unanswered > 0 ? 'signal' : 'quiet'}
            />
            <Fact
              label="contacts"
              value={state === 'loading' ? '—' : exact(counts.contacts)}
            />
          </>
        }
        actions={
          <>
            {bots.length > 1 ? (
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger
                  className="h-8 w-full text-sm sm:w-52"
                  aria-label="Filter by chatbot"
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
        }
      />

      <Panel>
        <PanelBody className="space-y-0 px-3 pt-4 sm:px-4">
          <Toolbar
            count={
              state === 'ready'
                ? `${exact(rows.length)} ${plural(rows.length, 'thread')}${
                    hasMore ? ' of ' + exact(counts[tab]) : ''
                  }${scopedBot ? ` · ${scopedBot.name}` : ''}`
                : undefined
            }
          >
            <Segmented
              size="sm"
              value={tab}
              onChange={(next) => setTab(next as TabValue)}
              options={tabOptions}
            />
          </Toolbar>

          {state === 'loading' ? (
            <RowsSkeleton rows={5} />
          ) : state === 'error' ? (
            <div className="pb-2">
              <ErrorState
                title="Could not load conversations"
                body="The inbox request did not come back. Nothing was changed — try again."
                onRetry={load}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="pb-2">
              {bots.length === 0 ? (
                <EmptyState
                  icon={BotpressOutlined}
                  title="No chatbots yet"
                  body="Conversations appear here as soon as a deployed chatbot starts answering. Create one and point it at your site."
                  action={<Button onClick={() => onNavigate?.('chatbots')}>Create a chatbot</Button>}
                />
              ) : counts.all === 0 ? (
                <EmptyState
                  icon={Comment1TextOutlined}
                  title="No conversations in this window"
                  body="Nobody has talked to this chatbot in the last few weeks. If it is not on your site yet, the embed snippet takes about a minute."
                  action={<Button onClick={() => onNavigate?.('deploy')}>Get the snippet</Button>}
                  secondary={
                    <Button variant="outline" onClick={() => onNavigate?.('playground')}>
                      Test it yourself
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Comment1TextOutlined}
                  title={
                    tab === 'unanswered'
                      ? 'Nothing went unanswered'
                      : 'Nobody left an address'
                  }
                  body={
                    tab === 'unanswered'
                      ? 'Every reply in this window had knowledge behind it. That is the outcome you want — check back after your next busy day.'
                      : 'No visitor typed an email address into a chat in this window. These are detected from the conversation, not collected by a form.'
                  }
                  action={
                    <Button variant="outline" onClick={() => setTab('all')}>
                      Show all threads
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <>
              <RowHead className={COLS}>
                <span>Conversation</span>
                <span className="text-right">Messages</span>
                <span className="hidden sm:block">Chatbot</span>
                <span className="hidden text-right sm:block">Last active</span>
                <span className="sr-only">Open</span>
              </RowHead>
              <RowList>
                {rows.map((thread) => (
                  <Row key={thread.threadId} className={`${COLS} items-center`}>
                    <button
                      type="button"
                      onClick={() => openTranscript(thread)}
                      className="min-w-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span className="block truncate tc-body text-foreground group-hover:text-signal">
                        {thread.opener ? excerpt(thread.opener) : 'No question recorded'}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {thread.unanswered ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-soft px-1.5 py-px tc-micro text-warning">
                            <span aria-hidden="true">!</span>
                            no knowledge
                          </span>
                        ) : null}
                        {thread.contactEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-1.5 py-px tc-micro text-muted-foreground">
                            <Lineicons
                              icon={Envelope1Outlined}
                              size={11}
                              aria-hidden="true"
                              focusable="false"
                            />
                            {thread.contactEmail}
                          </span>
                        ) : null}
                        <span className="tc-path text-muted-foreground sm:hidden">
                          {relativeTime(thread.lastActiveAt)}
                        </span>
                      </span>
                    </button>
                    <Mono className="text-right">{exact(thread.messages)}</Mono>
                    <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
                      {thread.chatbotName || '—'}
                    </span>
                    <Mono className="hidden text-right sm:block">
                      {relativeTime(thread.lastActiveAt)}
                    </Mono>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden size-8 text-muted-foreground hover:text-foreground sm:inline-flex"
                      onClick={() => openTranscript(thread)}
                      aria-label="Read this conversation"
                    >
                      <Lineicons icon={ArrowRightOutlined} className="size-4" />
                    </Button>
                  </Row>
                ))}
              </RowList>

              {hasMore ? (
                <div className="flex justify-center border-t border-border pt-3.5 pb-1">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={paging}>
                    {paging ? (
                      <Lineicons
                        icon={Spinner3Outlined}
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    Load {PAGE_SIZE} more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </PanelBody>
      </Panel>

      <Sheet
        open={Boolean(openThread)}
        onOpenChange={(next) => {
          if (!next) setOpenThread(null);
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-xl">
          <SheetHeader className="gap-1.5">
            <p className="tc-eyebrow">/inbox · transcript</p>
            <SheetTitle className="tc-heading">
              {openThread?.opener ? excerpt(openThread.opener, 80) : 'Conversation'}
            </SheetTitle>
            <SheetDescription className="tc-path text-muted-foreground">
              {openThread?.chatbotName || 'chatbot'} · {exact(openThread?.messages ?? 0)}{' '}
              {plural(openThread?.messages ?? 0, 'message')} ·{' '}
              {relativeTime(openThread?.lastActiveAt)}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {transcriptState === 'loading' ? (
              <RowsSkeleton rows={4} />
            ) : transcriptState === 'error' ? (
              <ErrorState
                title="Could not load the transcript"
                body="The thread is still in the list — the request for its messages failed."
                onRetry={() => (openThread ? void openTranscript(openThread) : undefined)}
              />
            ) : (
              <ol className="space-y-3.5">
                {(transcript?.messages ?? []).map((message) => {
                  const visitor = message.role === 'user';
                  return (
                    <li key={message.id} className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="tc-eyebrow">{visitor ? 'Visitor' : 'Chatbot'}</span>
                        <Mono className="text-muted-foreground">
                          {relativeTime(message.timestamp)}
                        </Mono>
                        {!visitor && message.grounded === false ? (
                          <span className="rounded-full border border-warning-border bg-warning-soft px-1.5 py-px tc-micro text-warning">
                            no knowledge
                          </span>
                        ) : null}
                        {!visitor && message.latencyMs !== null ? (
                          <Mono className="text-muted-foreground">
                            {seconds(message.latencyMs)}
                          </Mono>
                        ) : null}
                      </div>
                      <p
                        className={
                          visitor
                            ? 'tc-inset whitespace-pre-wrap px-3 py-2 tc-body text-foreground'
                            : 'whitespace-pre-wrap px-3 py-2 tc-body text-muted-foreground'
                        }
                      >
                        {message.content}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {openThread?.contactEmail || openThread?.unanswered ? (
          <SheetFooter className="gap-2">
            {openThread?.contactEmail ? (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="tc-eyebrow">Address left in chat</span>
                  <Mono>{openThread.contactEmail}</Mono>
                </div>
                <Hairline />
              </>
            ) : null}
            {openThread?.unanswered ? (
              <Button
                onClick={() => {
                  const bot = bots.find((item) => botId(item) === String(openThread.chatbotId));
                  if (bot) onSelectChatbot?.(bot);
                  setOpenThread(null);
                  onNavigate?.('knowledge');
                }}
                className="gap-1.5"
              >
                Add what was missing to knowledge
                <Lineicons icon={ArrowRightOutlined} className="size-3.5" />
              </Button>
            ) : null}
          </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
