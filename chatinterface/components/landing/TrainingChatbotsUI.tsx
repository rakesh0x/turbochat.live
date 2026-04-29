'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
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
  Zap,
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/nextAuthReact';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { MenuItem } from '@/lib/types/ui';

const urltogo = window.location.href;

const DashboardPage = dynamic(() => import('@/components/DashboardPage'));
const CreateChatbotPage = dynamic(() => import('@/components/createChatbot'));
const MyChatbotsPage = dynamic(() => import('@/components/Mychatbots'));
const PlaygroundPage = dynamic(() => import('./playground').then((mod) => mod.PlaygroundPage));
const DeployPage = dynamic(() => import('@/components/deploy').then((mod) => mod.DeployPage));
const AnalyticsPage = dynamic(() => import('@/components/AnalyticsPage'));
const SettingsPage = dynamic(() => import('@/components/SettingsPage'));
const TrainingPage = dynamic(() => import('@/components/TrainingPage'));

function BillingPage({
  userProfile,
  stats,
  chatbotCount,
}: {
  userProfile: any;
  stats: any;
  chatbotCount: number;
}) {
  const credits = userProfile?.credits ?? 0;
  const trials = userProfile?.freeTrialRemaining ?? 0;
  const totalMessages = stats?.totalMessages ?? 0;

  return (
    <Card className="mx-auto max-w-4xl border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
      <CardHeader>
        <CardTitle>Billing & Usage</CardTitle>
        <CardDescription>Monitor credits and upgrade when you are ready to scale.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-800">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="mt-1 text-2xl font-semibold">{credits}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-800">
            <p className="text-xs text-muted-foreground">Free Trials</p>
            <p className="mt-1 text-2xl font-semibold">{trials}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-800">
            <p className="text-xs text-muted-foreground">Monthly Messages</p>
            <p className="mt-1 text-2xl font-semibold">{Number(totalMessages).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">You currently manage {chatbotCount} chatbot(s). Upgrade your plan for higher limits.</p>
      </CardContent>
    </Card>
  );
}

const payload = {
  name: "user.me",
  chatbot: "chatbot.list",
  stats: "stats.get",
  analytics: "analytics.get",
  chatbot_sharing_get: "chatbot.share.get",
  chatbot_conversation_get: "chatbot.conversation.get"
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
  const remainingFreeTrials = userProfile?.freeTrialRemaining ?? 0;
  const hasUsageQuota = remainingCredits > 0 || remainingFreeTrials > 0;
  const canCreateChatbot = TEMP_DISABLE_CREDIT_BLOCKADE || hasUsageQuota;

  useEffect(() => {
    async function resultsfromBFF() {
      const response = await fetch(`${urltogo}/api/bff`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setUserProfile(data.name);
      setChatbots(chatbots),
      setStats(stats),
      setAnalytics(analytics),
    
      console.log(data);

    }

    void resultsfromBFF();
  }, []);

  const getCreateBlockMessage = () => {
    if (TEMP_DISABLE_CREDIT_BLOCKADE) return '';
    if (remainingCredits > 0 || remainingFreeTrials > 0) return '';
    return 'You have no credits or free trials left. Please upgrade to create a chatbot.';
  };

  const handleCreatePageAccess = () => {
    if (!canCreateChatbot) {
      toast.error(getCreateBlockMessage());
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
    (false);
  }, [currentPage]);

  const fetchData = async () => {
    try {
      if (!session) return;

      const fetchJson = async (
        endpoint: string,
        opts: { fallback: any; critical: boolean },
      ) => {
        try {
          const res = await fetch(endpoint);
          const contentType = res.headers.get('content-type') || '';
          const rawBody = await res.text();

          if (!res.ok) {
            let message = rawBody || `Request failed (${res.status})`;
            if (contentType.includes('application/json')) {
              try {
                const parsed = JSON.parse(rawBody);
                message = parsed?.detail || parsed?.message || parsed?.error || message;
              } catch {
                // Fall back to plain body text when malformed JSON is returned.
              }
            }
            throw new Error(`${endpoint}: ${message}`);
          }

          if (!rawBody) return opts.fallback;

          if (contentType.includes('application/json')) {
            return JSON.parse(rawBody);
          }

          throw new Error(`${endpoint}: Expected JSON but received ${contentType || 'unknown content type'}`);
        } catch (error) {
          if (opts.critical) throw error;
          console.warn(`Non-critical data fetch failed for ${endpoint}:`, error);
          return opts.fallback;
        }
      };

      const [chatbotsData, statsData, analyticsData, userData] = await Promise.all([
        fetchJson('/api/chatbots', { fallback: [], critical: true }),
        fetchJson('/api/stats', { fallback: null, critical: true }),
        fetchJson('/api/analytics', { fallback: null, critical: true }),
        fetchJson('/api/users/me', { fallback: null, critical: false }),
      ]);

      setChatbots(Array.isArray(chatbotsData) ? chatbotsData : []);
      setStats(statsData);
      setAnalytics(analyticsData);
      setUserProfile(userData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load data');
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
                  <div className="relative h-[46px] w-[120px]">
                    <p className="absolute left-[5px] top-[5px] whitespace-nowrap text-[24px] leading-6 [font-family:'Jersey_10'] text-slate-900 dark:text-slate-100">
                      <span className="text-slate-900 dark:text-slate-100">Turbo</span>
                      <span className="inline-block text-slate-900 dark:text-slate-100">
                        chat
                      </span>
                    </p>
                    <p className="pt-[30px] text-[11px] text-slate-500 dark:text-slate-400">Workspace</p>
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
                      className={`h-10 w-full justify-start rounded-xl px-3 text-sm ${currentPage === item.id
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
          <div className="flex items-center gap-2">
            <div className="relative h-[46px] w-[120px]">
              <span className="absolute left-[5px] top-[5px] whitespace-nowrap text-[24px] leading-6 [font-family:'Jersey_10'] text-slate-900 dark:text-slate-100">
                <span className="text-slate-900 dark:text-slate-100">Turbo</span>
                <span className="inline-block text-slate-900 dark:text-slate-100">
                  chat
                </span>
              </span>
              <span className="block pt-[30px] text-xs text-slate-500 dark:text-slate-400">Workspace Console</span>
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
                  className={`w-full justify-start text-sm h-10 rounded-xl px-3 ${currentPage === item.id
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
                  <div className="text-xs text-muted-foreground truncate">{userProfile?.plan || 'Free'} Plan • {remainingCredits} Credits • {remainingFreeTrials} Free Trials</div>
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
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-amber-300/60 bg-gradient-to-r from-amber-100/90 to-yellow-50 px-4 shadow-[0_8px_24px_rgba(245,158,11,0.25)] transition hover:from-amber-100 hover:to-amber-50 dark:border-amber-500/40 dark:from-amber-950/50 dark:to-amber-900/30"
              onClick={() => router.push('/pricing')}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{remainingCredits} Credits</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-cyan-300/60 bg-gradient-to-r from-cyan-100/85 to-sky-50 px-4 shadow-[0_8px_24px_rgba(6,182,212,0.22)] transition hover:from-cyan-100 hover:to-sky-100 dark:border-cyan-500/40 dark:from-cyan-950/50 dark:to-sky-900/30"
              onClick={() => router.push('/pricing')}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-cyan-700 dark:text-cyan-300" />
              <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{remainingFreeTrials} Trials</span>
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
                onComplete={(createdBot: any) => {
                  if (createdBot) {
                    setSelectedChatbot(createdBot);
                  }
                  fetchData();
                  setCurrentPage('deploy');
                  toast.success('Chatbot created. You can deploy it now.');
                }}
                canCreateChatbot={canCreateChatbot}
                remainingCredits={remainingCredits}
                remainingFreeTrials={remainingFreeTrials}
                onBlocked={() => setCurrentPage('billing')}
              />
            )}
            {currentPage === 'chatbots' && (
              <MyChatbotsPage
                chatbots={chatbots}
                loading={loading}
                onSelectChatbot={(bot: any) => { setSelectedChatbot(bot); setCurrentPage('playground'); }}
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