'use client';

import { Lineicons } from "@lineiconshq/react-lineicons";
import { Message2Outlined, StopwatchOutlined, Bolt2Outlined, BotpressOutlined, TrendUp1Outlined, TrendDown1Outlined, ArrowAngularTopRightOutlined, PlusOutlined, CalendarDaysOutlined, Spinner3Outlined } from "@lineiconshq/free-icons";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { DashboardPageProps } from '@/lib/types/ui';

const BLUE = '#3b82f6';
const CYAN = '#06b6d4';

const PLACEHOLDER_VOLUME = [
  { date: 'Week 1', messages: 0 },
  { date: 'Week 2', messages: 0 },
  { date: 'Week 3', messages: 0 },
  { date: 'Week 4', messages: 0 },
];

const PLACEHOLDER_WEEKLY = [
  { day: 'Mon', messages: 0 },
  { day: 'Tue', messages: 0 },
  { day: 'Wed', messages: 0 },
  { day: 'Thu', messages: 0 },
  { day: 'Fri', messages: 0 },
  { day: 'Sat', messages: 0 },
  { day: 'Sun', messages: 0 },
];

export default function DashboardPage({
  stats, chatbots, loading, canCreateChatbot, onCreateChatbot, userProfile, analytics,
}: DashboardPageProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Lineicons icon={Spinner3Outlined} size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalMessages = stats?.totalMessages || 0;
  const totalChatbots = stats?.totalChatbots || 0;
  const activeChatbots = Array.isArray(chatbots) ? chatbots.filter((b) => b.status === 'active').length : 0;
  const trainingBots = stats?.trainingBots || 0;
  const credits = userProfile?.credits ?? 0;
  const plan = userProfile?.plan || 'Free';
  const trialDays = userProfile?.freeTrialRemaining ?? 0;

  const timeSavedHours = Math.round(totalMessages * 3 / 60);

  const messagesOverTime: Array<{ date: string; messages: number }> = Array.isArray(analytics?.messagesOverTime) ? analytics.messagesOverTime : [];

  const computeTrend = () => {
    if (messagesOverTime.length < 2) return { value: 0, isUp: true };
    const mid = Math.floor(messagesOverTime.length / 2);
    const first = messagesOverTime.slice(0, mid).reduce((s: number, d) => s + (d.messages || 0), 0);
    const second = messagesOverTime.slice(mid).reduce((s: number, d) => s + (d.messages || 0), 0);
    if (first === 0) return { value: 0, isUp: true };
    return { value: Math.round(((second - first) / first) * 100), isUp: second >= first };
  };
  const trend = computeTrend();

  const weeklyData = messagesOverTime.length > 0
    ? messagesOverTime.slice(-7).map((d: { date: string; messages: number }) => ({ day: d.date, messages: d.messages }))
    : [];

  const chartData = messagesOverTime.length > 0 ? messagesOverTime : PLACEHOLDER_VOLUME;
  const barData = weeklyData.length > 0 ? weeklyData : PLACEHOLDER_WEEKLY;

  const creditMax = plan === 'enterprise' ? 10000 : plan === 'pro' ? 1000 : 100;
  const creditPct = Math.min(100, Math.round((credits / creditMax) * 100));

  const topBots = Array.isArray(chatbots)
    ? [...chatbots].sort((a, b) => (b?.monthlyMessages || 0) - (a?.monthlyMessages || 0)).slice(0, 5)
    : [];

  const formatNum = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toLocaleString();

  const tooltipStyles = {
    contentStyle: {
      background: '#fff',
      border: '1px solid #f1f5f9',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      fontSize: '13px',
      padding: '10px 14px',
    },
    labelStyle: { fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  };

  const ChartTooltip = ({ active, payload, label, prefix = '' }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyles.contentStyle}>
        <p style={tooltipStyles.labelStyle}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 500, fontSize: 13 }}>
            {prefix}{p.value.toLocaleString()} {p.name}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of your workspace performance</p>
        </div>
        <Badge variant="outline" className="text-xs font-normal gap-1.5 px-3 py-1.5">
          <Lineicons icon={CalendarDaysOutlined} size={12} />
          This Month
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label text-xs font-medium text-slate-500 uppercase tracking-wider">Messages Received</span>
          </div>
          <div className="stat-value text-3xl font-bold text-slate-900 tracking-tight">{formatNum(totalMessages)}</div>
          <div className="flex items-center gap-1.5 mt-2">
            {trend.isUp
              ? <Lineicons icon={TrendUp1Outlined} size={14} className="text-emerald-500" />
              : <Lineicons icon={TrendDown1Outlined} size={14} className="text-red-500" />}
            <span className={`text-xs font-medium ${trend.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label text-xs font-medium text-slate-500 uppercase tracking-wider">Time Saved</span>
          </div>
          <div className="stat-value text-3xl font-bold text-slate-900 tracking-tight">
            {timeSavedHours}
            <span className="text-lg font-medium text-slate-400 ml-1">hrs</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            ~{totalMessages * 3} min of support time automated this month
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label text-xs font-medium text-slate-500 uppercase tracking-wider">Credits Remaining</span>
          </div>
          <div className="stat-value text-3xl font-bold text-slate-900 tracking-tight">{credits}</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 tabular-nums">{creditPct}% used</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label text-xs font-medium text-slate-500 uppercase tracking-wider">Active Chatbots</span>
          </div>
          <div className="stat-value text-3xl font-bold text-slate-900 tracking-tight">
            {activeChatbots}
            <span className="text-lg font-medium text-slate-400 ml-1">/ {totalChatbots}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {trainingBots > 0 ? `${trainingBots} currently training` : 'All bots are synced'}
          </p>
        </div>
      </div>

      <Card className="border-slate-200/70 shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Message Volume</CardTitle>
              <CardDescription>Daily messages over the last 30 days</CardDescription>
            </div>
            {trend.value !== 0 && (
              <Badge
                variant="outline"
                className={`gap-1 ${trend.isUp ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}
              >
                {trend.isUp ? <Lineicons icon={TrendUp1Outlined} size={12} /> : <Lineicons icon={TrendDown1Outlined} size={12} />}
                {trend.value > 0 ? '+' : ''}{trend.value}% vs last month
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                    <stop offset="50%" stopColor={BLUE} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} strokeWidth={1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                  tickMargin={4}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-8}
                  tickMargin={4}
                />
                <Tooltip
                  content={<ChartTooltip prefix="" />}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke={messagesOverTime.length > 0 ? BLUE : '#cbd5e1'}
                  strokeWidth={2.5}
                  strokeDasharray={messagesOverTime.length > 0 ? 'none' : '4 4'}
                  fill={messagesOverTime.length > 0 ? 'url(#volumeFill)' : 'transparent'}
                  dot={false}
                  activeDot={messagesOverTime.length > 0 ? {
                    r: 5,
                    fill: '#fff',
                    stroke: BLUE,
                    strokeWidth: 2.5,
                    filter: 'url(#glow)',
                  } : false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-slate-200/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Messages in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CYAN} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CYAN} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} strokeWidth={1} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 400 }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 400 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-8}
                  />
                  <Tooltip
                    content={<ChartTooltip prefix="" />}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="messages"
                    fill={weeklyData.length > 0 ? 'url(#barFill)' : '#e2e8f0'}
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Chatbots</CardTitle>
                <CardDescription>Ranked by monthly conversation volume</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500 hover:text-slate-700">
                See all
                <Lineicons icon={ArrowAngularTopRightOutlined} size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topBots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400">
                <Lineicons icon={BotpressOutlined} size={32} className="mb-2 text-slate-300" />
                No chatbot data yet
              </div>
            ) : (
              <div className="space-y-2">
                {topBots.map((bot, i) => (
                  <div
                    key={bot.id}
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3.5 transition-all duration-200 hover:border-slate-200 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{bot.name}</div>
                        <div className="text-xs text-slate-400 truncate">{bot.website || 'No website'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          bot.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : bot.status === 'training'
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : 'bg-slate-50 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {bot.status}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md ring-1 ring-slate-100">
                        {(bot.monthlyMessages || 0).toLocaleString()} msgs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Lineicons icon={PlusOutlined} size={20} className="text-white" />
          </div>
          <div>
            <p className="section-title text-sm font-medium text-slate-900">Ready to scale your support?</p>
            <p className="text-xs text-slate-500 mt-0.5">Create a new chatbot or import your knowledge base</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateChatbot} disabled={!canCreateChatbot} size="sm" className="gap-1.5">
            <Lineicons icon={PlusOutlined} size={14} />
            Create Chatbot
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Lineicons icon={ArrowAngularTopRightOutlined} size={14} />
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
