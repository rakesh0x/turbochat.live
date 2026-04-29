import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2, MessageSquare, TrendingUp, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Analytics } from "@/lib/interfaces";



export default function AnalyticsPage({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 shadow-xl shadow-sky-100/70 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/20 dark:shadow-none">
        <h2 className="text-xl font-semibold tracking-tight">Performance Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track response quality, usage trends, and growth signals across your AI assistants.</p>
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5K</div>
            <p className="text-xs text-muted-foreground mt-1">+23% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground mt-1">-15% faster</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">+5% improvement</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8K</div>
            <p className="text-xs text-muted-foreground mt-1">+18% growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messageOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Top Questions</CardTitle>
            <CardDescription>Most asked this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topQuestions?.map((q: { question?: string; questions?: string; count: number }, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.question ?? q.questions ?? "Untitled question"}</div>
                    <div className="text-xs text-muted-foreground">{q.count} times</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}