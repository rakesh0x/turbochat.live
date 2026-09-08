"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { CheckOutlined, Spinner3Outlined } from "@lineiconshq/free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Field,
  Mono,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  Segmented,
  exact,
  plural,
} from "@/components/dashboard/kit";

/* ==========================================================================
   Create a chatbot  ·  /create
   --------------------------------------------------------------------------
   Three steps, and the middle one takes minutes — so the middle one has to be
   worth watching. It now reads as a build log rather than a spinner with a
   percentage: the same timestamps, in a mono well, above a meter that moves.

   The success step used to report "23 pages", "GPT-4" and "100%" as literal
   strings in the JSX, while `createdBot.pagesScraped` sat unused two lines
   away. It reports the real crawl now, and says nothing about the model,
   because nothing in the response tells us which one answered.

   None of the creation logic changed: same endpoints, same polling interval,
   same posthog events, same credit guard.
   ========================================================================== */

const CRAWL_PRESETS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
] as const;

const STEPS = [
  { id: 1, label: 'Setup' },
  { id: 2, label: 'Reading' },
  { id: 3, label: 'Ready' },
] as const;

function hostOf(raw: string): string {
  if (!raw) return '';
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).host.replace(/^www\./, '');
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

const TEMP_DISABLE_CREDIT_BLOCKADE = true;

export default function CreateChatbotPage({
  onComplete,
  canCreateChatbot,
  remainingCredits,
  remainingFreeTrials,
  onBlocked,
  successButtonText = "Deploy Now",
}: {
  onComplete: (createdBot: any) => void;
  canCreateChatbot: boolean;
  remainingCredits: number;
  remainingFreeTrials: number;
  onBlocked: () => void;
  successButtonText?: string;
}) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [crawlLimit, setCrawlLimit] = useState(10);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ text: string; timestamp: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBot, setCreatedBot] = useState<any>(null);
  const completionTriggeredRef = useRef(false);
  const { data: session } = useSession();

  const finishCreation = (bot: any) => {
    if (!bot || completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    onComplete(bot);
  };

  const startRealTraining = async () => {
    try {
      if (!session) {
        toast.error('Please sign in to create a chatbot.');
        return;
      }

      if (!TEMP_DISABLE_CREDIT_BLOCKADE && !canCreateChatbot) {
        toast.error('You have no credits or free trials left. Please upgrade to create a chatbot.');
        onBlocked();
        return;
      }

      // Double-check usage quota right before create to handle stale UI state.
      if (!TEMP_DISABLE_CREDIT_BLOCKADE) {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          const hasCredits = (userData?.credits ?? 0) > 0;
          const hasTrials = (userData?.freeTrialRemaining ?? 0) > 0;
          if (!hasCredits && !hasTrials) {
            toast.error('You have no credits or free trials left. Please upgrade to create a chatbot.');
            onBlocked();
            return;
          }
        }
      }

      completionTriggeredRef.current = false;
      posthog.capture("chatbot_creation_started", {
        chatbot_name: chatbotName,
        website_url: url,
        crawl_limit: crawlLimit,
        user_id: (session?.user as any)?.id,
        user_email: session?.user?.email,
      })
      setStep(2);
      setIsProcessing(true);
      setLogs([{ text: 'Initializing Crawling engine...', timestamp: new Date().toLocaleTimeString() }]);
      setProgress(10);

      const res = await fetch('/api/chatbot/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: chatbotName,
          website: url,
          limit: crawlLimit
        })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        let backendMessage = '';
        try {
          const parsed = JSON.parse(errorBody);
          backendMessage = parsed?.detail || parsed?.message || parsed?.error || '';
        } catch {
          backendMessage = errorBody;
        }

        if (res.status === 402) {
          posthog.capture("chatbot_creation_failed", {
            chatbot_name: chatbotName,
            error: "Insufficient credits",
            stage: "creation",
            user_id: (session?.user as any)?.id,
            user_email: session?.user?.email,
          })
          toast.error('Insufficient credits or free trials. Please upgrade your plan.');
          setStep(1);
          setIsProcessing(false);
          onBlocked();
          return;
        }
        throw new Error(backendMessage || `Failed to create chatbot (HTTP ${res.status})`);
      }
      const newBot = await res.json();
      const botId = newBot.id;

      setLogs(prev => [...prev, { text: 'Bot created. Starting site crawl...', timestamp: new Date().toLocaleTimeString() }]);
      setProgress(30);

      // 2. Poll for status
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/chatbots');
          const chatbots = await statusRes.json();
          const currentBot = chatbots.find((b: any) => b.id === botId);

          if (!currentBot) return;

          if (currentBot.status === 'active') {
            clearInterval(pollInterval);
            posthog.capture("chatbot_creation_completed", {
              chatbot_id: currentBot.id,
              chatbot_name: currentBot.name,
              pages_scraped: currentBot.pagesScraped,
              user_id: (session?.user as any)?.id,
              user_email: session?.user?.email,
            })
            setLogs(prev => [...prev, { text: `Success! Crawled ${currentBot.pagesScraped} pages.`, timestamp: new Date().toLocaleTimeString() }]);
            setProgress(100);
            setIsProcessing(false);
            setCreatedBot(currentBot);
            setStep(3);
            setTimeout(() => finishCreation(currentBot), 1800);
          } else if (currentBot.status === 'error') {
            clearInterval(pollInterval);
            const backendError = currentBot.trainingError || 'Error during crawling. No detailed error was returned by backend (likely old deployment or pending migration).';
            posthog.capture("chatbot_creation_failed", {
              chatbot_id: currentBot.id,
              chatbot_name: chatbotName,
              error: backendError,
              stage: "training",
              user_id: (session?.user as any)?.id,
              user_email: session?.user?.email,
            })
            setLogs(prev => [...prev, { text: backendError, timestamp: new Date().toLocaleTimeString() }]);
            setIsProcessing(false);
            toast.error(`Training failed: ${backendError}`);
          } else {
            // Still training
            const dynamicProgress = Math.min(95, 30 + (attempts * 2));
            setProgress(dynamicProgress);
            if (attempts % 5 === 0) {
              setLogs(prev => [...prev, { text: 'Crawl4AI is still working...', timestamp: new Date().toLocaleTimeString() }]);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);

    } catch (error) {
      console.error('Failed to start training:', error);
      posthog.capture("chatbot_creation_failed", {
        chatbot_name: chatbotName,
        error: error instanceof Error ? error.message : String(error),
        stage: "creation",
        user_id: (session?.user as any)?.id,
        user_email: session?.user?.email,
      })
      posthog.captureException(error)
      toast.error(error instanceof Error ? error.message : 'Failed to create chatbot');
      setStep(1);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Where you are. Quiet, mono, and it never claims a step you haven't
          finished — the tick only appears once the step is behind you. */}
      <ol className="flex items-center gap-2">
        {STEPS.map((item, index) => {
          const done = step > item.id;
          const here = step === item.id;
          return (
            <li key={item.id} className="flex flex-1 items-center gap-2">
              <span className="flex items-center gap-2">
                <span
                  className={
                    done
                      ? 'flex size-5 items-center justify-center rounded-full bg-signal text-[0.6875rem] text-signal-ink'
                      : here
                        ? 'flex size-5 items-center justify-center rounded-full border border-foreground bg-foreground tc-micro text-background'
                        : 'flex size-5 items-center justify-center rounded-full border border-border bg-surface-2 tc-micro text-muted-foreground'
                  }
                >
                  {done ? <Lineicons icon={CheckOutlined} className="size-3" /> : item.id}
                </span>
                <span
                  className={
                    here || done
                      ? 'tc-meta font-medium text-foreground'
                      : 'tc-meta text-muted-foreground'
                  }
                >
                  {item.label}
                </span>
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={`h-px flex-1 ${done ? 'bg-foreground/30' : 'bg-border'}`}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <Panel>
          <PanelHeader
            eyebrow="/create"
            title="What should it read?"
            description="Give it a site and we read the pages, turn them into text it can search, and hand you a widget."
          />
          <PanelBody className="space-y-6">
            <Field
              label="Website URL"
              htmlFor="tc-url"
              hint={url ? `We will start at ${hostOf(url)} and follow links from there.` : 'The page we start from — usually your home page or your docs index.'}
            >
              <Input
                id="tc-url"
                placeholder="https://example.com"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              />
            </Field>

            <Field
              label="Chatbot name"
              htmlFor="tc-name"
              hint="Only you see this. It is how the chatbot is listed in your console."
            >
              <Input
                id="tc-name"
                placeholder="Support assistant"
                value={chatbotName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatbotName(e.target.value)}
              />
            </Field>

            <Field
              label="Pages to read"
              htmlFor="tc-limit"
              hint="More pages means broader answers and a longer first crawl. You can add sources later."
            >
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  size="sm"
                  value={String(crawlLimit)}
                  onChange={(next) => setCrawlLimit(parseInt(next, 10) || 10)}
                  options={CRAWL_PRESETS.map((item) => ({ value: item.value, label: item.label }))}
                />
                <Input
                  id="tc-limit"
                  type="number"
                  min={1}
                  max={100}
                  value={crawlLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCrawlLimit(parseInt(e.target.value) || 10)
                  }
                  className="h-8 w-20"
                  aria-label="Pages to read"
                />
                <Mono>{plural(crawlLimit, 'page')}</Mono>
              </div>
            </Field>

            {!canCreateChatbot && (
              <p className="rounded-md border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
                {exact(remainingCredits)} credits and {exact(remainingFreeTrials)} free trials left.
                Upgrade your plan to create another chatbot.
              </p>
            )}
          </PanelBody>
          <PanelFooter className="justify-between">
            <span className="tc-meta text-muted-foreground">
              The first crawl usually finishes in a couple of minutes.
            </span>
            <Button onClick={startRealTraining} disabled={!url || !chatbotName || !canCreateChatbot}>
              Start reading
            </Button>
          </PanelFooter>
        </Panel>
      )}

      {step === 2 && (
        <Panel>
          <PanelHeader
            eyebrow="/index"
            title="Reading your site"
            description="You can leave this page open or come back to it — the crawl keeps going either way."
          />
          <PanelBody className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="tc-eyebrow">progress</span>
                <Mono>{progress}%</Mono>
              </div>
              <span
                className="tc-meter mt-2 h-1.5"
                style={{ ['--tc-fill' as any]: `${progress}%` }}
              >
                <span className="tc-meter-bar" />
              </span>
            </div>

            <div className="tc-well p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="tc-eyebrow">crawl log</span>
                {isProcessing ? (
                  <span className="flex items-center gap-2 tc-micro text-muted-foreground">
                    <span className="tc-live-dot" />
                    working
                  </span>
                ) : (
                  <span className="tc-micro text-muted-foreground">stopped</span>
                )}
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-1.5 px-4 py-3 tc-micro">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-muted-foreground">
                      <span className="shrink-0 text-foreground/60">{log.timestamp}</span>
                      <span className="min-w-0 text-foreground">{log.text}</span>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lineicons icon={Spinner3Outlined} className="size-3 animate-spin" />
                      <span>waiting for the crawler…</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </PanelBody>
        </Panel>
      )}

      {step === 3 && (
        <Panel className="border-success-border">
          <PanelBody className="space-y-6 py-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-success-border bg-success-soft">
              <Lineicons icon={CheckOutlined} className="size-5 text-success-ink" />
            </span>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-foreground">
                {createdBot?.name || chatbotName} is ready
              </h2>
              <p className="text-sm text-muted-foreground">
                It has read your site and can answer questions about it. Next: try it, then embed it.
              </p>
            </div>
            <dl className="mx-auto grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
              <div className="bg-card px-4 py-3">
                <dt className="tc-eyebrow">pages read</dt>
                <dd className="tc-num mt-1 font-mono text-xl text-foreground">
                  {exact(Number(createdBot?.pagesScraped) || 0)}
                </dd>
              </div>
              <div className="bg-card px-4 py-3">
                <dt className="tc-eyebrow">source</dt>
                <dd className="mt-1 truncate tc-path text-foreground">
                  {hostOf(String(createdBot?.website ?? url)) || '—'}
                </dd>
              </div>
            </dl>
            <Button onClick={() => finishCreation(createdBot)}>{successButtonText}</Button>
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}
