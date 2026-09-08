'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  ArrowUpwardOutlined,
  BotpressOutlined,
  Message2QuestionOutlined,
  RefreshCircle1ClockwiseOutlined,
} from '@lineiconshq/free-icons';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import {
  Bone,
  EmptyState,
  ErrorState,
  Fact,
  Kbd,
  LiveTag,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  StatusPill,
  exact,
} from '@/components/dashboard/kit';
import { cn } from '@/lib/utils';
import type { PlaygroundPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Playground  ·  /answer
   --------------------------------------------------------------------------
   The screen where you interrogate your own bot before a customer does. It
   was a chat app pastiche: a sidebar card repeating facts the page header
   already carries, ink-filled bubbles at 16px radius, three bouncing dots,
   and a failure that arrived as a toast and left an empty bubble behind.

   What changed, and why:

   · The transcript is a transcript. Visitor turns sit right on a raised
     surface, the bot's sit left on the panel ground — told apart by where
     they are, not by a block of colour. One panel, one fixed height, one
     scroll area, composer pinned to its floor.

   · Waiting is described honestly. Before the first token there is nothing
     to type out, so the bot's turn shows a `tc-crawl` bar labelled
     "retrieving" — the same vocabulary the crawl screens use. Once tokens
     arrive, a blinking caret trails the text.

   · Errors are said out loud. An `{error}` frame or a dead request now ends
     up in the transcript as an ErrorState with a retry that re-sends the
     same question, instead of a toast that disappears.

   · The empty state offers three starter questions. They fill the composer
     rather than firing on click, so the first thing a new customer types is
     their own edit of a sensible question.

   The network path below is the original, line for line: same stream and
   history endpoints, same `data: ` frame parsing, same `{token}` / `{done}`
   / `{error}` branches, same AbortController behind Stop.
   ========================================================================== */

type Msg = {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  streaming?: boolean;
  stopped?: boolean;
  failed?: boolean;
};

/* Deliberately generic: the API tells us nothing about what a given bot was
   trained on, so these are the three questions every visitor asks. Anything
   more specific would be a guess dressed up as a suggestion. */
const STARTERS = [
  'What does this product do?',
  'How much does it cost, and is there a free plan?',
  'How do I get in touch with a human?',
];

/** One turn. No avatars, no tails, no 2xl radius — position carries the role. */
function TurnRow({ turn, botLabel }: { turn: Msg; botLabel: string }) {
  const visitor = turn.role === 'user';
  const waiting = Boolean(turn.streaming) && turn.content.length === 0;

  return (
    <div className={cn('flex flex-col gap-1.5', visitor ? 'items-end' : 'items-start')}>
      <p className="tc-eyebrow">{visitor ? 'you' : botLabel}</p>

      {waiting ? (
        <span className="flex items-center gap-2 py-0.5">
          <span aria-hidden="true" className="tc-crawl h-1 w-20 rounded-full" />
          <span className="tc-eyebrow">retrieving</span>
        </span>
      ) : (
        <div
          className={cn(
            'min-w-0 max-w-[88%] tc-body text-foreground',
            visitor && 'tc-well rounded-lg border border-border bg-surface-2 px-3.5 py-2.5',
          )}
        >
          <p className="overflow-x-auto break-words whitespace-pre-wrap">
            {turn.content}
            {turn.streaming ? (
              <span
                aria-hidden="true"
                className="animate-blink-cursor ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-signal align-middle"
              />
            ) : null}
          </p>
          {turn.stopped ? <p className="tc-eyebrow mt-1.5">stopped</p> : null}
        </div>
      )}
    </div>
  );
}

export function PlaygroundPage({ chatbot }: PlaygroundPageProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(`session-${Date.now()}`);
  const abortRef = useRef<AbortController | null>(null);
  const lastSent = useRef('');

  useEffect(() => {
    if (chatbot) {
      loadConversation();
    }
  }, [chatbot]);

  /* Scroll the transcript, not the document. `scrollIntoView` on a node inside
     a nested scroller drags the whole page up on every token. */
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /* The composer grows with the question and stops at ten lines. */
  useEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [input]);

  const loadConversation = async () => {
    if (!chatbot) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/conversation?sessionId=${sessionId.current}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setHistoryError('Earlier turns in this session could not be loaded.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false, stopped: true } : m)));
    setIsTyping(false);
    posthog.capture('playground_stream_stopped', { chatbot_id: chatbot?.id });
  };

  /* Lifted out of the click handler so Retry can re-run the same question
     through the same path. The body is unchanged from the version that only
     ever read `input`. */
  const send = async (raw: string) => {
    if (!raw.trim() || !chatbot || isTyping) return;

    lastSent.current = raw;
    setStreamError(null);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: raw,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageContent = raw;
    setInput('');
    setIsTyping(true);
    posthog.capture('playground_message_sent', {
      chatbot_id: chatbot.id,
      length: messageContent.length,
    });

    // Add streaming assistant bubble
    const asstId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: asstId, role: 'assistant', content: '', timestamp: new Date().toISOString(), streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, conversation_id: sessionId.current }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('Stream request failed');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let parsed: any;
          try { parsed = JSON.parse(line.slice(6)); } catch { continue; }
          if (parsed.token) {
            setMessages((prev) =>
              prev.map((m) => m.id === asstId ? { ...m, content: m.content + parsed.token } : m)
            );
          }
          if (parsed.done || parsed.error) {
            /* Both frames end the stream. An error frame also gets repeated to
               the reader — the old code closed the bubble and said nothing. */
            if (parsed.error) {
              const detail = String(parsed.error);
              setStreamError(detail);
              posthog.capture('playground_stream_failed', { chatbot_id: chatbot.id, reason: detail });
            }
            setMessages((prev) => prev.map((m) => m.id === asstId ? { ...m, streaming: false, failed: Boolean(parsed.error) } : m));
            setIsTyping(false);
            return;
          }
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Stream error:', error);
      setStreamError(
        error?.message === 'Stream request failed'
          ? 'The answer service refused the request. Check that the backend is running.'
          : String(error?.message || 'The answer stream could not be reached.'),
      );
      posthog.capture('playground_stream_failed', { chatbot_id: chatbot.id, reason: String(error?.message ?? 'unknown') });
      setMessages((prev) =>
        prev.map((m) => m.id === asstId ? { ...m, content: m.content, streaming: false, failed: true } : m)
      );
    } finally {
      setIsTyping(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  };

  const handleSend = () => {
    void send(input);
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  };

  /* Retry drops the failed pair first, so the question is not asked twice in
     the transcript for one answer. */
  const retry = () => {
    const question = lastSent.current;
    setStreamError(null);
    setMessages((prev) => {
      let next = prev;
      const tail = next[next.length - 1];
      if (tail && tail.role !== 'user' && (tail.failed || tail.content.length === 0)) {
        next = next.slice(0, -1);
      }
      const asked = next[next.length - 1];
      if (asked?.role === 'user') next = next.slice(0, -1);
      return next;
    });
    posthog.capture('playground_retry', { chatbot_id: chatbot?.id });
    if (question) void send(question);
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    setStreamError(null);
    setHistoryError(null);
    setIsTyping(false);
    sessionId.current = `session-${Date.now()}`;
    posthog.capture('playground_conversation_reset', { chatbot_id: chatbot?.id });
  };

  const fillComposer = (question: string) => {
    setInput(question);
    posthog.capture('playground_starter_selected', { chatbot_id: chatbot?.id });
    composerRef.current?.focus();
  };

  /* An assistant turn that finished with nothing in it is not a turn — it is a
     failure, and the ErrorState below says so. Don't draw an empty frame. */
  const turns = useMemo(
    () => messages.filter((m) => m.content.length > 0 || m.streaming),
    [messages],
  );
  const askedCount = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages]);

  const pages = chatbot?.pagesScraped ?? chatbot?.pages_indexed ?? chatbot?.pagesIndexed ?? null;
  const botLabel = String(chatbot?.name ?? 'bot').toLowerCase();
  const blurb =
    'Ask what a visitor would ask. Answers stream from the pages this bot has indexed — if something is not in there, it should say so rather than guess.';

  if (!chatbot) {
    return (
      <>
        <PageHeader eyebrow="/answer" title="Playground" description={blurb} />
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={BotpressOutlined}
              title="No chatbot in scope"
              body="Pick a chatbot in the switcher above and its answers will stream in here. Nothing is sent anywhere until you ask a question."
            />
          </PanelBody>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="/answer"
        title="Playground"
        description={blurb}
        meta={
          <>
            {chatbot?.name ? <Fact label="chatbot" value={chatbot.name} /> : null}
            <Fact label="pages" value={exact(pages)} tone="signal" />
            {chatbot?.model ? <Fact label="model" value={String(chatbot.model)} /> : null}
            <Fact label="turns" value={exact(askedCount)} />
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={messages.length === 0 && !isTyping}
          >
            <Lineicons
              icon={RefreshCircle1ClockwiseOutlined}
              size={14}
              aria-hidden="true"
              focusable="false"
            />
            Reset conversation
          </Button>
        }
      />

      <Panel className="flex h-[clamp(30rem,72vh,44rem)] flex-col overflow-hidden">
        <PanelHeader
          title="Conversation"
          description="One session, kept until you reset it. The bot sees the last few turns as context."
          action={isTyping ? <LiveTag label="streaming" /> : <StatusPill status={chatbot?.status} />}
        />

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto border-t border-border px-6 py-5 sm:px-7"
        >
          {loadingHistory ? (
            <div className="space-y-4" aria-hidden="true">
              <Bone className="ml-auto h-10 w-1/2" />
              <Bone className="h-20 w-3/4" />
              <Bone className="ml-auto h-10 w-1/3" />
            </div>
          ) : turns.length === 0 ? (
            <div className="flex h-full min-h-0 flex-col justify-center gap-3.5">
              {historyError ? (
                <ErrorState
                  title="Could not load this session"
                  body={historyError}
                  onRetry={() => void loadConversation()}
                />
              ) : (
                <EmptyState
                  icon={Message2QuestionOutlined}
                  title="Ask it something"
                  body="Answers come only from the pages this bot has read, so the fastest way to find a gap in its knowledge is to ask the question a customer would."
                />
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                {STARTERS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => fillComposer(question)}
                    className="tc-tile tc-lift px-3 py-2.5 text-left"
                  >
                    <span className="tc-eyebrow block">starter</span>
                    <span className="mt-1 block tc-body text-foreground">
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {turns.map((turn) => (
                <TurnRow key={turn.id} turn={turn} botLabel={botLabel} />
              ))}
              {streamError ? (
                <ErrorState
                  title="The answer did not come back"
                  body={streamError}
                  onRetry={retry}
                  className="py-7"
                />
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface-2/40 px-4 py-3.5 sm:px-5">
          <div className="tc-inset bg-card transition-[border-color,box-shadow] focus-within:border-border-strong focus-within:ring-2 focus-within:ring-ring/50">
            <label htmlFor="tc-playground-composer" className="sr-only">
              Message
            </label>
            <textarea
              id="tc-playground-composer"
              ref={composerRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder={isTyping ? 'Answering — press Stop to cut it short' : 'Ask what a visitor would ask'}
              className="tc-scrollbar-none block max-h-60 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 tc-body text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
              <p className="tc-path flex flex-wrap items-center gap-1.5 text-muted-foreground">
                <Kbd>⏎</Kbd> send
                <span aria-hidden="true">·</span>
                <Kbd>⇧⏎</Kbd> newline
              </p>
              {isTyping ? (
                <Button variant="outline" size="sm" onClick={stopStream}>
                  <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-danger" />
                  Stop
                </Button>
              ) : (
                <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
                  Send
                  <Lineicons
                    icon={ArrowUpwardOutlined}
                    size={14}
                    aria-hidden="true"
                    focusable="false"
                  />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* The answer stream carries text and nothing else — no chunk ids, no
            passages. Rather than invent a citation list, the panel says what is
            missing and shows the mark a real one will wear. */}
        <PanelFooter>
          <span className="tc-eyebrow">sources</span>
          <p className="min-w-0 flex-1 tc-meta text-muted-foreground">
            The answer stream returns text only, so no citations are shown rather than guessed at.
            When it carries them, the retrieved passage an answer came from will sit here{' '}
            <span className="tc-marker" data-lit="true">
              marked like this
            </span>
            .
          </p>
        </PanelFooter>
      </Panel>
    </>
  );
}
