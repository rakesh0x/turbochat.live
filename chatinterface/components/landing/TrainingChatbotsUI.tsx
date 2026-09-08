'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/nextAuthReact';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { DEFAULT_PAGE, isAgentPage, resolvePage, type PageId } from '@/components/dashboard/nav';
import { LowCreditsBanner, readCredits } from '@/components/dashboard/upsell';
import { PanelSkeleton } from '@/components/dashboard/kit';
import { isOnboarded, resolveFirstRun } from '@/lib/onboarding';

/* ==========================================================================
   The console
   --------------------------------------------------------------------------
   This file owns three things and delegates everything else: the data, the
   current place, and which screen renders. It used to also own a sidebar, a
   header, a mobile drawer and an inline billing screen — all of which now
   live in `dashboard/shell.tsx` and `BillingPage.tsx` where they can be
   reused and reasoned about.

   Two behaviours changed on purpose:

   · The place is in the URL (`?p=knowledge&bot=42`). Before, it was React
     state, so a refresh dropped you back on Overview, the back button left
     the console entirely, and no screen could be linked to a colleague.

   · A brand-new account is sent to `/onboarding` once — and only once. The
     OAuth callback cannot know whether the person signing in is new, so the
     decision is made here, where the bot list is already being fetched: no
     chatbots *and* no record of having been offered first run means first
     run. Skipping or finishing it writes that record, so nobody is bounced
     out of the console twice. An account that owns a chatbot never sees it.
   ========================================================================== */

const DashboardPage = dynamic(() => import('@/components/DashboardPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-72" />,
});
const MyChatbotsPage = dynamic(() => import('@/components/Mychatbots'), {
  loading: () => <PanelSkeleton bodyHeight="h-64" />,
});
const PlaygroundPage = dynamic(() => import('./playground').then((mod) => mod.PlaygroundPage), {
  loading: () => <PanelSkeleton bodyHeight="h-[28rem]" />,
});
const DeployPage = dynamic(() => import('@/components/deploy').then((mod) => mod.DeployPage), {
  loading: () => <PanelSkeleton bodyHeight="h-64" />,
});
const AnalyticsPage = dynamic(() => import('@/components/AnalyticsPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-72" />,
});
const SettingsPage = dynamic(() => import('@/components/SettingsPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-64" />,
});
const TrainingPage = dynamic(() => import('@/components/TrainingPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-64" />,
});
const BillingPage = dynamic(() => import('@/components/BillingPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-72" />,
});
const ConversationsPage = dynamic(() => import('@/components/ConversationsPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-72" />,
});
const IntegrationsPage = dynamic(() => import('@/components/IntegrationsPage'), {
  loading: () => <PanelSkeleton bodyHeight="h-64" />,
});

const payload = {
  name: 'user.me',
  chatbot: 'chatbot.list',
  stats: 'stats.get',
  analytics: 'analytics.get',
  chatbot_sharing_get: 'chatbot.share.get',
  chatbot_conversation_get: 'chatbot.conversation.get',
};

const TEMP_DISABLE_CREDIT_BLOCKADE = true;

function botIdOf(bot: any): string | null {
  const raw = bot?.id ?? bot?._id ?? null;
  return raw === null || raw === undefined ? null : String(raw);
}

export function ChatInterface() {
  const [page, setPage] = useState<PageId>(DEFAULT_PAGE);
  const [botId, setBotId] = useState<string | null>(null);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { data: session } = useSession();

  const credits = useMemo(() => readCredits(userProfile), [userProfile]);
  const canCreateChatbot = TEMP_DISABLE_CREDIT_BLOCKADE || credits.spendable > 0;

  /* The selected bot is explicit state, not a silent `chatbots[0]` fallback in
     seven different render branches. When it resolves to the first bot we say
     so in the URL, so the switcher and the address bar never disagree. */
  const selectedChatbot = useMemo(() => {
    if (chatbots.length === 0) return null;
    const match = chatbots.find((bot) => botIdOf(bot) === botId);
    return match ?? chatbots[0];
  }, [chatbots, botId]);

  const writeUrl = useCallback(
    (nextPage: PageId, nextBot: string | null, mode: 'push' | 'replace') => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (nextPage === DEFAULT_PAGE) params.delete('p');
      else params.set('p', nextPage);
      if (nextBot) params.set('bot', nextBot);
      else params.delete('bot');
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
    },
    [],
  );

  /* Adopt the URL after mount rather than in a lazy initializer: the server
     renders without a query string, so reading it during the first render
     would hand React two different trees to reconcile. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = resolvePage(params.get('p'));
    if (fromUrl) setPage(fromUrl);
    const bot = params.get('bot');
    if (bot) setBotId(bot);
  }, []);

  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search);
      setPage(resolvePage(params.get('p')) ?? DEFAULT_PAGE);
      setBotId(params.get('bot'));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* Keep the address bar honest about which bot is on screen. */
  useEffect(() => {
    const resolved = botIdOf(selectedChatbot);
    if (resolved && resolved !== botId) {
      setBotId(resolved);
      writeUrl(page, resolved, 'replace');
    }
  }, [selectedChatbot, botId, page, writeUrl]);

  /* First run, decided once. `firstRunRef` matters: without it a slow /api
     round trip can re-run this after the router has already started moving,
     and the customer gets two navigations for one decision. */
  const firstRunRef = useRef(false);
  useEffect(() => {
    if (loading || firstRunRef.current) return;
    if (chatbots.length > 0) {
      // Owning a chatbot is proof enough; stop offering first run for good.
      if (!isOnboarded()) resolveFirstRun();
      return;
    }
    if (!session || isOnboarded()) return;
    firstRunRef.current = true;
    router.replace('/onboarding');
  }, [loading, chatbots.length, session, router]);

  /* An agent screen with no agent is a broken screen. If the last bot is
     deleted while Deploy is open, fall back rather than render an empty frame. */
  useEffect(() => {
    if (!loading && chatbots.length === 0 && isAgentPage(page)) {
      setPage(DEFAULT_PAGE);
      writeUrl(DEFAULT_PAGE, null, 'replace');
    }
  }, [loading, chatbots.length, page, writeUrl]);

  const navigate = useCallback(
    (next: PageId) => {
      const target = isAgentPage(next) && chatbots.length === 0 ? DEFAULT_PAGE : next;
      setPage(target);
      writeUrl(target, botId, 'push');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    },
    [botId, chatbots.length, writeUrl],
  );

  const selectChatbot = useCallback(
    (bot: any) => {
      const id = botIdOf(bot);
      setBotId(id);
      writeUrl(page, id, 'push');
    },
    [page, writeUrl],
  );

  const handleCreatePageAccess = useCallback(() => {
    router.push('/onboarding');
  }, [router]);

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: '/' });
  }, []);

  /* ---- data ----------------------------------------------------------------
     Unchanged contract: same endpoints, same fallbacks, same critical flags.
     The only edit is that the BFF call no longer ends in three self-
     assignments (`setChatbots(chatbots)`) that overwrote nothing and logged
     the whole response to the console on every mount. */
  const fetchData = useCallback(async () => {
    try {
      if (!session) return;

      const fetchJson = async (endpoint: string, opts: { fallback: any; critical: boolean }) => {
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

          throw new Error(
            `${endpoint}: Expected JSON but received ${contentType || 'unknown content type'}`,
          );
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
  }, [session]);

  /* The BFF and `/api/users/me` both describe the same person, and both used
     to write `userProfile` unconditionally — so whichever response landed last
     decided what the credit meter said. REST wins now; the BFF only fills the
     gap when it arrives first or `/api/users/me` failed. */
  useEffect(() => {
    async function resultsfromBFF() {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/bff`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setUserProfile((current: any) => current ?? data?.name ?? null);
    }

    void resultsfromBFF().catch((error) => {
      console.warn('BFF profile prefetch failed:', error);
    });
  }, []);

  useEffect(() => {
    if (session) void fetchData();
  }, [session, fetchData]);

  /* ---- render -------------------------------------------------------------- */

  function screen() {
    switch (page) {
      case 'chatbots':
        return (
          <MyChatbotsPage
            chatbots={chatbots}
            loading={loading}
            onSelectChatbot={(bot: any) => {
              selectChatbot(bot);
              navigate('playground');
            }}
            onRefresh={fetchData}
            canCreateChatbot={canCreateChatbot}
            onCreateChatbot={handleCreatePageAccess}
          />
        );
      case 'inbox':
        return (
          <ConversationsPage
            chatbots={chatbots}
            loading={loading}
            onNavigate={(next: string) => navigate(next as PageId)}
            onSelectChatbot={selectChatbot}
          />
        );
      case 'integrations':
        return (
          <IntegrationsPage
            chatbots={chatbots}
            selectedChatbot={selectedChatbot}
            loading={loading}
            onNavigate={(next: string) => navigate(next as PageId)}
          />
        );
      case 'billing':
        return (
          <BillingPage userProfile={userProfile} stats={stats} chatbotCount={chatbots.length} />
        );
      case 'knowledge':
        return <TrainingPage chatbot={selectedChatbot} />;
      case 'playground':
        return <PlaygroundPage chatbot={selectedChatbot} />;
      case 'deploy':
        return <DeployPage chatbot={selectedChatbot} />;
      case 'analytics':
        return (
          <AnalyticsPage
            analytics={analytics}
            chatbots={chatbots}
            loading={loading}
            onNavigate={(next: string) => navigate(next as PageId)}
            onSelectChatbot={selectChatbot}
          />
        );
      case 'settings':
        return <SettingsPage chatbot={selectedChatbot} />;
      case 'dashboard':
      default:
        return (
          <DashboardPage
            stats={stats}
            chatbots={chatbots}
            loading={loading}
            canCreateChatbot={canCreateChatbot}
            onCreateChatbot={handleCreatePageAccess}
            userProfile={userProfile}
            analytics={analytics}
            onNavigate={(next: string) => navigate(next as PageId)}
            onSelectChatbot={selectChatbot}
          />
        );
    }
  }

  return (
    <>
      <Toaster />
      <DashboardShell
        page={page}
        onNavigate={navigate}
        chatbots={chatbots}
        selectedChatbot={selectedChatbot}
        onSelectChatbot={selectChatbot}
        onCreateChatbot={handleCreatePageAccess}
        onSignOut={handleLogout}
        user={session?.user ?? {}}
        credits={credits}
        loading={loading}
      >
        <LowCreditsBanner state={credits} />
        {screen()}
      </DashboardShell>
    </>
  );
}
