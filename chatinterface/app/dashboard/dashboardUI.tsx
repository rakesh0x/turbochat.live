import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Activity, ArrowUpRight, Download, Github, RefreshCw, Bot, Globe, Zap, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DashboardPageProps } from "@/lib/types/ui";

function DashboardPage({ stats, chatbots, loading, canCreateChatbot, onCreateChatbot }: DashboardPageProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalChatbots = stats?.totalChatbots || 0;
  const totalPages = stats?.totalPages || 0;
  const trainingBots = stats?.trainingBots || 0;
  const totalMessages = stats?.totalMessages || 0;
  const activeChatbots = Array.isArray(chatbots) ? chatbots.filter((bot) => bot.status === 'active').length : 0;
  const healthScore = totalChatbots > 0 ? Math.min(100, Math.round((activeChatbots / totalChatbots) * 100)) : 0;

  const statCards = [
    {
      title: 'Total Chatbots',
      value: totalChatbots,
      helper: `${activeChatbots} active now`,
      icon: Bot,
      tone: 'from-sky-500/15 to-cyan-500/10 border-sky-200/60 dark:border-sky-500/25',
    },
    {
      title: 'Pages In Knowledge Base',
      value: totalPages,
      helper: `${Math.max(0, totalPages - 50)} added this month`,
      icon: Globe,
      tone: 'from-emerald-500/15 to-teal-500/10 border-emerald-200/60 dark:border-emerald-500/25',
    },
    {
      title: 'Training In Progress',
      value: trainingBots,
      helper: trainingBots > 0 ? 'Optimizing responses' : 'All bots are synced',
      icon: Zap,
      tone: 'from-amber-500/15 to-orange-500/10 border-amber-200/60 dark:border-amber-500/25',
    },
    {
      title: 'Monthly Messages',
      value: totalMessages.toLocaleString(),
      helper: 'Conversation volume this cycle',
      icon: MessageSquare,
      tone: 'from-rose-500/15 to-pink-500/10 border-rose-200/60 dark:border-rose-500/25',
    },
  ];

  const topBots = Array.isArray(chatbots)
    ? [...chatbots]
      .sort((a, b) => (b?.monthlyMessages || 0) - (a?.monthlyMessages || 0))
      .slice(0, 5)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />

        <div className="relative grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Badge className="mb-3 bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900">Operations Command Center</Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
              Keep every customer conversation fast, smart, and conversion-ready.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Your workspace health, chatbot fleet, and message throughput in one premium control panel.
              Launch new assistants, monitor readiness, and scale support without losing quality.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={onCreateChatbot} disabled={!canCreateChatbot} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Chatbot
              </Button>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                View Growth Report
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">System Health</p>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{healthScore}%</div>
            <p className="mt-1 text-xs text-slate-500">Based on active bots and training stability</p>
            <Progress value={healthScore} className="mt-4 h-2" />

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-slate-500">Active</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{activeChatbots}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-slate-500">Training</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{trainingBots}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
          >
            <Card className={`bg-gradient-to-br ${item.tone}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{item.value}</div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.helper}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-slate-200/70 dark:border-slate-800/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Chatbots</CardTitle>
                <CardDescription>Ranked by monthly conversations and response readiness</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                See all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBots.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No chatbot data yet. Create your first assistant to start seeing activity.
              </div>
            )}
            {topBots.map((bot, index) => {
              const statusTone = bot.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : bot.status === 'training'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

              return (
                <div
                  key={bot.id}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3 transition hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{bot.name}</div>
                      <div className="truncate text-xs text-slate-500">{bot.website}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`capitalize ${statusTone}`}>{bot.status}</Badge>
                    <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {(bot.monthlyMessages || 0).toLocaleString()} msgs
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 dark:border-slate-800/70">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcuts to keep your workspace shipping fast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start gap-2" variant="outline" onClick={onCreateChatbot} disabled={!canCreateChatbot}>
              <Plus className="h-4 w-4" />
              Create New Chatbot
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Download className="h-4 w-4" />
              Import Knowledge Base
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Github className="h-4 w-4" />
              Sync with GitHub
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <RefreshCw className="h-4 w-4" />
              Re-train All Bots
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}