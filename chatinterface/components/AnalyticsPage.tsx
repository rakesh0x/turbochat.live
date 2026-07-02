import { Lineicons } from "@lineiconshq/react-lineicons";
import { Message2Outlined, Bolt2Outlined, TrendUp1Outlined, BeatOutlined, Spinner3Outlined, BarChart4Outlined } from "@lineiconshq/free-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Analytics } from "@/lib/types/analytics";

const CYAN = '#06b6d4';

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <p className="font-semibold text-slate-900 mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Lineicons icon={Spinner3Outlined} size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 shadow-xl shadow-sky-100/70 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/20 dark:shadow-none">
        <h2 className="text-xl font-semibold tracking-tight">Performance Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track response quality, usage trends, and growth signals across your AI assistants.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-2xl font-bold">12.5K</div>
            <p className="text-xs text-muted-foreground mt-1">+23% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground mt-1">-15% faster</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">+5% improvement</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-2xl font-bold">2.8K</div>
            <p className="text-xs text-muted-foreground mt-1">+18% growth</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none overflow-hidden">
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messageOverTime ?? analytics.messagesOverTime ?? []} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CYAN} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} strokeWidth={1} />
                <XAxis
                  dataKey="date"
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
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke={CYAN}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#fff', stroke: CYAN, strokeWidth: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Top Questions</CardTitle>
              <Lineicons icon={BarChart4Outlined} size={16} className="text-muted-foreground" />
            </div>
            <CardDescription>Most asked this month</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topQuestions?.length ? (
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.topQuestions.length * 48)}>
                <BarChart
                  data={analytics.topQuestions.map((q) => ({
                    question: (q.question ?? q.questions ?? '').length > 30
                      ? (q.question ?? q.questions ?? '').slice(0, 30) + '...'
                      : (q.question ?? q.questions ?? ''),
                    count: q.count,
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                  barCategoryGap={8}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} strokeWidth={1} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="question"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 400 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="count"
                    fill={CYAN}
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No question data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
