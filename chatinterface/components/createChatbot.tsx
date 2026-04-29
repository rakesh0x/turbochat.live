"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const TEMP_DISABLE_CREDIT_BLOCKADE = true;

export default function CreateChatbotPage({
  onComplete,
  canCreateChatbot,
  remainingCredits,
  remainingFreeTrials,
  onBlocked,
}: {
  onComplete: (createdBot: any) => void;
  canCreateChatbot: boolean;
  remainingCredits: number;
  remainingFreeTrials: number;
  onBlocked: () => void;
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
      setLogs([{ text: 'Initializing Crawl4AI...', timestamp: new Date().toLocaleTimeString() }]);
      setProgress(10);

      // 1. Create the chatbot (starts background training)
      const res = await fetch('/api/chatbots', {
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress Steps */}
      <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-slate-900 text-white shadow-md shadow-slate-500/25 dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className="text-xs text-slate-500 mt-2">
                  {s === 1 ? 'Setup' : s === 2 ? 'Training' : 'Complete'}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Enter URL */}
      {step === 1 && (
        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Configure Your Chatbot</CardTitle>
            <CardDescription>Launch your assistant with the right domain scope and crawl depth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chatbot Name</Label>
              <Input
                placeholder="Customer Support Bot"
                value={chatbotName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatbotName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Crawl Limit (Pages)</Label>
                <span className="text-xs font-mono text-muted-foreground">{crawlLimit} pages</span>
              </div>
              <Input
                type="number"
                min={1}
                max={100}
                value={crawlLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlLimit(parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20">
              <p className="text-sm text-muted-foreground">
                Powered by Crawl4AI. We'll crawl up to {crawlLimit} pages, extract Markdown content, and train your AI.
              </p>
            </div>
            {!canCreateChatbot && (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10">
                <p className="text-sm text-destructive">
                  You have {remainingCredits} credits and {remainingFreeTrials} free trials. Upgrade your plan to create more chatbots.
                </p>
              </div>
            )}
          </CardContent>
          <CardContent className="pt-0">
            <Button
              onClick={startRealTraining}
              disabled={!url || !chatbotName || !canCreateChatbot}
              className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Start Training
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Training */}
      {step === 2 && (
        <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Training in Progress</CardTitle>
            <CardDescription>This may take a few minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>

            <Card className="border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-sm">Training Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                      <div key={i} className="text-muted-foreground">
                        <span className="text-foreground">[{log.timestamp}]</span> {log.text}
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card className="border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 shadow-xl shadow-emerald-100/80 dark:border-emerald-900/40 dark:from-slate-950 dark:via-emerald-950/30 dark:to-cyan-950/20 dark:shadow-none">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chatbot Created!</h2>
              <p className="text-muted-foreground mt-1">Your chatbot is ready. Taking you to Deploy...</p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-xl font-bold">23</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-xl font-bold">GPT-4</div>
                <div className="text-xs text-muted-foreground">Model</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-xl font-bold">100%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            <Button
              onClick={() => finishCreation(createdBot)}
              className="mx-auto rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Deploy Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
