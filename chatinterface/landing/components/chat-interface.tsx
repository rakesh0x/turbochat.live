'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Bot,
  Database,
  PlayCircle,
  Rocket,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  Globe,
  Loader2,
  Check,
  Copy,
  Github,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Zap,
  TrendingUp,
  MessageSquare,
  Activity,
  RefreshCw,
  Send,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from "next-auth/react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}

interface CopyHandlerParams {
  code: string;
}

interface Chatbot {
  id: string;
  name: string;
  website: string;
  status: 'active' | 'inactive' | 'training';
  pagesScraped: number;
  monthlyMessages: number;
  lastUpdated: string;
  model: string;
}

interface Stats {
  totalChatbots: number;
  totalPages: number;
  trainingBots: number;
  totalMessages: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Analytics {
  messagesOverTime: Array<{ date: string; messages: number }>;
  topQuestions: Array<{ question: string; count: number }>;
}

interface LogEntry {
  text: string;
  timestamp: string;
}

interface Plan {
  name: 'Free' | 'Pro' | 'Enterprise';
  price: string;
  popular?: boolean;
  features: string[];
}

interface CopyParams {
  code: string;
}

interface HandleCopyParams {
  code: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Plus, label: 'Create a Chatbot', id: 'create' },
  { icon: Bot, label: 'My Chatbots', id: 'chatbots' },
  { icon: Database, label: 'Training & Data', id: 'training' },
  { icon: PlayCircle, label: 'Playground', id: 'playground' },
  { icon: Rocket, label: 'Deploy', id: 'deploy' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: CreditCard, label: 'Billing', id: 'billing' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const TEMP_DISABLE_CREDIT_BLOCKADE = true;

export function ChatInterface() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const remainingCredits = userProfile?.credits ?? 0;
  const canCreateChatbot = TEMP_DISABLE_CREDIT_BLOCKADE || remainingCredits > 0;

  const handleCreatePageAccess = () => {
    if (!canCreateChatbot) {
      toast.error('You have 0 credits. Please upgrade to create a chatbot.');
      setCurrentPage('billing');
      return;
    }
    setCurrentPage('create');
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [currentPage]);

  const fetchData = async () => {
    try {
      if (!session) return;

      const [chatbotsRes, statsRes, analyticsRes, userRes] = await Promise.all([
        fetch('/api/chatbots'),
        fetch('/api/stats'),
        fetch('/api/analytics'),
        fetch('/api/users/me')
      ]);

      const chatbotsData = await chatbotsRes.json();
      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();
      const userData = await userRes.json();

      setChatbots(Array.isArray(chatbotsData) ? chatbotsData : []);
      setStats(statsData);
      setAnalytics(analyticsData);
      setUserProfile(userData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fffbeb_35%,_#f8fafc_80%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_45%,_#020617_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/10" />
      <Toaster />

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.button
              key="mobile-sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close mobile sidebar"
            />

            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,20rem)] flex-col border-r border-white/50 bg-white/92 shadow-2xl backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-950/92 md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/70 px-4 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-700 text-[11px] font-semibold text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                    TC
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Turbochat AI</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Workspace</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1.5">
                  {menuItems.map((item) => (
                    <Button
                      key={`drawer-${item.id}`}
                      variant={currentPage === item.id ? 'secondary' : 'ghost'}
                      className={`h-10 w-full justify-start rounded-xl px-3 text-sm ${
                        currentPage === item.id
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-400/30 dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                      }`}
                      onClick={() => item.id === 'create' ? handleCreatePageAccess() : setCurrentPage(item.id)}
                      disabled={item.id === 'create' && !canCreateChatbot}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="relative z-10 hidden w-72 shrink-0 border-r border-white/50 bg-white/65 backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-950/60 md:flex md:flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/60 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-xs font-semibold text-white shadow-lg shadow-slate-500/25 dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
              TC
            </div>
            <div>
              <span className="block font-semibold text-sm tracking-tight">Turbochat AI</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Workspace Console</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-5">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-none">
            <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Navigation</p>
            <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start text-sm h-10 rounded-xl px-3 ${
                  currentPage === item.id
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-400/30 dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
                onClick={() => item.id === 'create' ? handleCreatePageAccess() : setCurrentPage(item.id)}
                disabled={item.id === 'create' && !canCreateChatbot}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
            </nav>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-white/70 dark:border-slate-800/80">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-3 rounded-2xl border border-white/80 bg-white/80 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-900">
                <Avatar className="w-7 h-7 mr-2">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">Rakesh Jha</div>
                  <div className="text-xs text-muted-foreground truncate">{userProfile?.plan || 'Free'} Plan • {remainingCredits} Credits</div>
                </div>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/70 dark:border-slate-800/80 flex items-center justify-between px-4 md:px-6 bg-white/65 backdrop-blur-2xl dark:bg-slate-950/55">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </Button>

            <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Turbochat Workspace</p>
            <h1 className="text-lg font-semibold tracking-tight">
              {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-300/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900" onClick={() => router.push('/pricing')}>
              <span className="text-sm text-amber-600 dark:text-amber-400 font-bold">{remainingCredits} Credits</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {currentPage === 'dashboard' && (
              <DashboardPage
                stats={stats}
                chatbots={chatbots}
                loading={loading}
                canCreateChatbot={canCreateChatbot}
                onCreateChatbot={handleCreatePageAccess}
              />
            )}
            {currentPage === 'create' && (
              <CreateChatbotPage
                onComplete={() => { fetchData(); setCurrentPage('chatbots'); }}
                canCreateChatbot={canCreateChatbot}
                remainingCredits={remainingCredits}
                onBlocked={() => setCurrentPage('billing')}
              />
            )}
            {currentPage === 'chatbots' && (
              <MyChatbotsPage
                chatbots={chatbots}
                loading={loading}
                onSelectChatbot={(bot) => { setSelectedChatbot(bot); setCurrentPage('playground'); }}
                onRefresh={fetchData}
                canCreateChatbot={canCreateChatbot}
                onCreateChatbot={handleCreatePageAccess}
              />
            )}
            {currentPage === 'playground' && <PlaygroundPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'deploy' && <DeployPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'analytics' && <AnalyticsPage analytics={analytics} />}
            {currentPage === 'billing' && (
              <BillingPage
                userProfile={userProfile}
                stats={stats}
                chatbotCount={chatbots.length}
              />
            )}
            {currentPage === 'settings' && <SettingsPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'training' && <TrainingPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Page
interface DashboardPageProps {
  stats: any;
  chatbots: any[];
  loading: boolean;
  canCreateChatbot: boolean;
  onCreateChatbot: () => void;
}

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

// Create Chatbot Page
function CreateChatbotPage({
  onComplete,
  canCreateChatbot,
  remainingCredits,
  onBlocked,
}: {
  onComplete: () => void;
  canCreateChatbot: boolean;
  remainingCredits: number;
  onBlocked: () => void;
}) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [crawlLimit, setCrawlLimit] = useState(10);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ text: string; timestamp: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session } = useSession();

  const startRealTraining = async () => {
    try {
      if (!session) {
        toast.error('Please sign in to create a chatbot.');
        return;
      }

      if (!TEMP_DISABLE_CREDIT_BLOCKADE && !canCreateChatbot) {
        toast.error('You have 0 credits. Please upgrade to create a chatbot.');
        onBlocked();
        return;
      }

      // Double-check credits right before create to handle stale UI state.
      if (!TEMP_DISABLE_CREDIT_BLOCKADE) {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if ((userData?.credits ?? 0) <= 0) {
            toast.error('You have 0 credits. Please upgrade to create a chatbot.');
            onBlocked();
            return;
          }
        }
      }

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
          toast.error('Insufficient credits. Please upgrade your plan.');
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
            setLogs(prev => [...prev, { text: `Success! Crawled ${currentBot.pagesScraped} pages.`, timestamp: new Date().toLocaleTimeString() }]);
            setProgress(100);
            setIsProcessing(false);
            setStep(3);
            setTimeout(onComplete, 3000);
          } else if (currentBot.status === 'error') {
            clearInterval(pollInterval);
            const backendError = currentBot.trainingError || 'Error during crawling. No detailed error was returned by backend (likely old deployment or pending migration).';
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
                  You have {remainingCredits} credits. Upgrade your plan to create a chatbot.
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
              <p className="text-muted-foreground mt-1">Your chatbot is ready to use</p>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// My Chatbots Page
interface MyChatbotsPageProps {
  chatbots: any[];
  loading: boolean;
  onSelectChatbot: (bot: any) => void;
  onRefresh: () => void;
  canCreateChatbot: boolean;
  onCreateChatbot: () => void;
}

function MyChatbotsPage({
  chatbots,
  loading,
  onSelectChatbot,
  onRefresh,
  canCreateChatbot,
  onCreateChatbot,
}: MyChatbotsPageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleDelete = async () => {
    try {
      await fetch(`/api/chatbots/${chatbotToDelete}`, { 
        method: 'DELETE'
      });
      toast.success('Chatbot deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete chatbot');
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl border-white/80 bg-gradient-to-br from-white via-slate-50 to-amber-50 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 dark:shadow-none">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg shadow-slate-400/40 dark:from-slate-100 dark:to-slate-300">
            <Bot className="w-8 h-8 text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No chatbots yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first chatbot to get started</p>
          </div>
          <Button onClick={onCreateChatbot} disabled={!canCreateChatbot}>
            <Plus className="w-4 h-4 mr-2" />
            Create Chatbot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{chatbots.length} chatbots</p>
        <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbots.map((bot) => (
          <Card key={bot.id} className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md shadow-slate-300/60 dark:from-slate-100 dark:to-slate-300 dark:text-slate-900 dark:shadow-none">
                    <Bot className="w-5 h-5 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                    <CardDescription className="text-xs">{bot.website}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectChatbot(bot)}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setChatbotToDelete(bot.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize rounded-full px-2.5">
                  {bot.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{bot.pagesScraped}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium">{bot.monthlyMessages}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Updated {new Date(bot.lastUpdated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chatbot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chatbot? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Playground Page
interface PlaygroundPageProps {
  chatbot: any;
}

function PlaygroundPage({ chatbot }: PlaygroundPageProps) {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; timestamp: string }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session-${Date.now()}`);

  useEffect(() => {
    if (chatbot) {
      loadConversation();
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!chatbot) return;
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/conversation?sessionId=${sessionId.current}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatbot) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsTyping(true);

    try {
      // Call Python LLM backend via proxy
      const res = await fetch(`/api/chatbots/${chatbot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversation_id: sessionId.current
        })
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to connect to AI. Make sure the backend server is running.');
      setIsTyping(false);
    }
  };

  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto border-slate-200/80 dark:border-slate-800">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to test</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chatbot Info */}
      <Card className="h-fit border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md shadow-slate-300/60 dark:from-slate-100 dark:to-slate-300 dark:shadow-none">
              <Bot className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <CardTitle className="text-base">{chatbot.name}</CardTitle>
              <CardDescription className="text-xs">{chatbot.website}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{chatbot.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {chatbot.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-medium">{chatbot.pagesScraped}</span>
            </div>
          </div>
          <Separator />
          <Button
            variant="outline"
            className="w-full rounded-xl"
            size="sm"
            onClick={() => { setMessages([]); sessionId.current = `session-${Date.now()}`; }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-3 flex h-[640px] flex-col border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="border-b border-slate-200/70 dark:border-slate-800">
          <CardTitle>Chat Playground</CardTitle>
          <CardDescription>Test your chatbot with real conversations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Start a conversation</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Deploy Page
function DeployPage({ chatbot }: { chatbot: any }) {
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isSharePublic, setIsSharePublic] = useState(false);
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  useEffect(() => {
    const loadShareState = async () => {
      if (!chatbot?.id) return;
      try {
        const response = await fetch(`/api/chatbots/${chatbot.id}/share`);
        if (!response.ok) return;
        const data = await response.json();
        setShareSlug(data?.shareSlug || null);
        setIsSharePublic(Boolean(data?.isPublic));
      } catch {
        // best-effort share status load
      }
    };

    loadShareState();
  }, [chatbot?.id]);

  const reliableHost = host.replace('localhost', '127.0.0.1');
  const hostedShareUrl = shareSlug ? `${host}/share/${shareSlug}` : '';

  const scriptCode = chatbot ? `<script src="${reliableHost}/widget.js"></script>
<script>
  window.addEventListener('load', function() {
    ChatbotWidget.init({
      chatbotId: "${chatbot.id}",
      apiUrl: "${reliableHost}/api"
    });
  });
</script>` : '';

  const handleCopy = (code: string): void => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/publish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to publish hosted page');
      setShareSlug(data?.shareSlug || null);
      setIsSharePublic(true);
      toast.success('Hosted chatbot page published');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to publish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnpublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/unpublish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to unpublish hosted page');
      setIsSharePublic(false);
      toast.success('Hosted chatbot page unpublished');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to unpublish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to deploy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Tabs defaultValue="embed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/80 p-2 backdrop-blur md:grid-cols-5 dark:border-slate-800/80 dark:bg-slate-900/70">
          <TabsTrigger value="embed">Quick Embed</TabsTrigger>
          <TabsTrigger value="hosted">Hosted Mini Site</TabsTrigger>
          <TabsTrigger value="github">GitHub Export</TabsTrigger>
          <TabsTrigger value="react">React UI</TabsTrigger>
          <TabsTrigger value="api">API Ref</TabsTrigger>
        </TabsList>

        <TabsContent value="embed" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>One-Line Embed</CardTitle>
              <CardDescription>Paste this onto any website to reveal the chat widget.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-4 text-sm text-slate-100 dark:border-slate-800">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 backdrop-blur-sm"
                  onClick={() => handleCopy(scriptCode)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosted" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>Hosted Mini Site</CardTitle>
              <CardDescription>Publish a live share page for this chatbot with one click.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {isSharePublic ? 'Public link is active' : 'Public link is currently private'}
                  </p>
                </div>
                <Badge variant={isSharePublic ? 'default' : 'secondary'}>
                  {isSharePublic ? 'Published' : 'Unpublished'}
                </Badge>
              </div>

              {hostedShareUrl ? (
                <div className="relative">
                  <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-4 text-sm text-slate-100 dark:border-slate-800">
                    <code>{hostedShareUrl}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(hostedShareUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePublishHosted} disabled={shareLoading} className="gap-2">
                  {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Publish Mini Site
                </Button>
                <Button variant="outline" onClick={handleUnpublishHosted} disabled={shareLoading || !isSharePublic}>
                  Unpublish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => hostedShareUrl && window.open(hostedShareUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!hostedShareUrl || !isSharePublic}
                >
                  Open Live Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>GitHub / Self-Hosting Bundle</CardTitle>
              <CardDescription>Give your users their own repository assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/70">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Github className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option A: GitHub Repo</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Users can download this bundle, commit to GitHub, and enable GitHub Pages for instant hosting.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                    const blob = new Blob([`# My Chatbot: ${chatbot.name}

This repository contains my AI Chatbot frontend, powered by [ChatBot AI RAG-as-a-Service].

## Deployment
1. Upload to GitHub.
2. Enable GitHub Pages.
3. Your bot is live!
`], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'README.md';
                    a.click();

                    // Also trigger the HTML download
                    setTimeout(() => {
                      const htmlBlob = new Blob([`<!DOCTYPE html><html><head><title>${chatbot.name}</title></head><body><script src="${reliableHost}/widget.js"></script><script>window.addEventListener('load', function(){ChatbotWidget.init({chatbotId: "${chatbot.id}", apiUrl: "${reliableHost}/api"});});</script></body></html>`], { type: 'text/html' });
                      const htmlUrl = window.URL.createObjectURL(htmlBlob);
                      const htmlA = document.createElement('a');
                      htmlA.href = htmlUrl;
                      htmlA.download = 'index.html';
                      htmlA.click();
                    }, 500);
                  }}>
                    <Download className="w-3 h-3" />
                    Download Repo Bundle
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-amber-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-amber-950/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option B: All-in-One Site</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A single HTML file containing both the structure and the interactive widget. Perfect for landing pages.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                    const htmlBlob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatbot.name} - AI Chat</title>
    <style>
        body { margin: 0; font-family: system-ui; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .hero { text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 0.5rem; }
        p { color: #888; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>${chatbot.name}</h1>
        <p>AI Assistant Powered by RAG-as-a-Service</p>
    </div>
    <script src="${reliableHost}/widget.js"></script>
    <script>
        window.addEventListener('load', function() {
            ChatbotWidget.init({
                chatbotId: "${chatbot.id}",
                apiUrl: "${reliableHost}/api"
            });
        });
    </script>
</body>
</html>`], { type: 'text/html' });
                    const htmlUrl = window.URL.createObjectURL(htmlBlob);
                    const htmlA = document.createElement('a');
                    htmlA.href = htmlUrl;
                    htmlA.download = 'index.html';
                    htmlA.click();
                  }}>
                    <Download className="w-3 h-3" />
                    Export index.html
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>React Component</CardTitle>
              <CardDescription>Install via npm</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-xl border border-slate-200/80 bg-slate-950 p-4 text-sm text-slate-100 dark:border-slate-800">
                <code>npm install @chatbot-ai/react</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>REST API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <div className="text-sm font-medium mb-1">Base Endpoint</div>
                  <code className="text-xs text-muted-foreground">{host}/api</code>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-sm font-medium mb-1">Auth</div>
                  <code className="text-xs text-muted-foreground">None (Public)</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}

// Analytics Page
function AnalyticsPage({ analytics }: { analytics: Analytics | null }) {
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
              <LineChart data={analytics.messagesOverTime}>
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
              {analytics.topQuestions?.map((q, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.question}</div>
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

// Billing Page
function BillingPage({
  userProfile,
  stats,
  chatbotCount,
}: {
  userProfile: any;
  stats: any;
  chatbotCount: number;
}) {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      price: '$9',
      productId: 'pdt_0NauJou4mqDCcPVwp4kfS',
      features: ['5 projects', '1 GB storage', 'Email support'],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      productId: 'pdt_0NaGTaLaCP8TsMwaiw1t7',
      features: ['Unlimited projects', '100 GB storage', 'Priority support'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      productId: 'pdt_0NauLa7pvwInvZjndZt6y',
      features: ['SSO + team controls', 'Dedicated onboarding', 'Priority technical support'],
      highlighted: false,
    },
  ];

  const handleCheckout = async (productId: string, planName: string) => {
    if (!session?.user?.email) {
      toast.error('Please sign in before starting checkout.');
      return;
    }

    setLoadingPlan(planName);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          customer: {
            email: session.user.email,
            name: session.user.name || session.user.email,
          },
          metadata: {
            source: 'dashboard-billing-page',
          },
          return_url: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.message || 'Unable to start checkout');
      }

      window.location.href = data.checkout_url;
    } catch (error: any) {
      toast.error(error?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const totalMessages = stats?.totalMessages ?? 0;
  const currentPlan = (userProfile?.plan || 'free').toUpperCase();
  const chatbotUsagePercent = Math.min(100, (chatbotCount / 1) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl shadow-slate-400/35 dark:border-slate-800 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 dark:text-slate-900 dark:shadow-none">
        <h2 className="text-2xl font-semibold tracking-tight">Upgrade credits, keep building</h2>
        <p className="mt-2 text-sm text-white/80 dark:text-slate-700">Hosted pages, chatbot creation, and training run better with paid credits.</p>
      </section>

      {/* Usage */}
      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>{currentPlan} Plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages</span>
              <span className="font-medium">{totalMessages} total</span>
            </div>
            <Progress value={Math.min(100, totalMessages > 0 ? 70 : 5)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Chatbots</span>
              <span className="font-medium">{chatbotCount}</span>
            </div>
            <Progress value={chatbotUsagePercent} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted
              ? 'border-cyan-300/70 bg-cyan-50 text-slate-900 shadow-xl ring-1 ring-cyan-200/70 dark:text-slate-900'
              : 'border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none'}
          >
            {plan.highlighted && (
              <div className="px-4 pt-4">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className={`${plan.highlighted ? 'text-slate-700' : 'text-muted-foreground'}`}>/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                onClick={() => handleCheckout(plan.productId, plan.name)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.name ? 'Starting checkout...' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Settings Page
function SettingsPage({ chatbot }: { chatbot: any }) {
  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to configure</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chatbot Name</Label>
            <Input defaultValue={chatbot.name} />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input defaultValue={chatbot.website} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>AI Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select defaultValue="gpt-4">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5 shadow-lg shadow-red-100/60 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Delete Chatbot</div>
              <div className="text-xs text-muted-foreground">Permanently delete this chatbot</div>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}

// Training Page
function TrainingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 shadow-xl shadow-emerald-100/70 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 dark:shadow-none">
        <h2 className="text-xl font-semibold tracking-tight">Training Studio</h2>
        <p className="mt-1 text-sm text-muted-foreground">Feed your assistant with fresh docs, URLs, and product updates to improve response quality.</p>
      </section>

      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Add content to improve your chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
              <Globe className="w-6 h-6" />
              <span>Add Website</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
              <Download className="w-6 h-6" />
              <span>Upload Files</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
