'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  CreditCardMultipleOutlined,
  ExitOutlined,
  MenuHamburger1Outlined,
  MoonHalfRight5Outlined,
  PlusOutlined,
  Search1Outlined,
  Sun1Outlined,
} from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { hostOf, initials, Kbd } from './kit';
import { type CreditState } from './upsell';
import { AGENT_ITEMS, WORKSPACE_ITEMS, type PageId } from './nav';
import { SidebarNav } from './sidebar-nav';
import { TopUpProvider } from './topup';

/* ==========================================================================
   The shell
   --------------------------------------------------------------------------
   Two frames and one fact. The frames are a sidebar that says where you can
   go and a header that says what you can do from anywhere. The fact is *which
   chatbot you are looking at* — the thing the previous shell never told you,
   which is why five of its screens quietly rendered `chatbots[0]`.

   Deliberately not here: a page title in the header (the sidebar already
   said it, and the screen says it again in its own h1), a notification bell
   backed by no notification system, and a text "Logout" sitting at the same
   weight as the product's real actions.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Header controls
   -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* The server cannot know which theme the reader chose, so the icon only
     commits after mount. Rendering the wrong glyph for one frame is worse
     than rendering none. */
  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {mounted ? (
        <Lineicons
          icon={dark ? Sun1Outlined : MoonHalfRight5Outlined}
          size={15}
          aria-hidden="true"
          focusable="false"
        />
      ) : (
        <span className="size-[15px]" />
      )}
    </Button>
  );
}

function UserMenu({
  user,
  planLabel,
  onSignOut,
  onViewBilling,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  planLabel: string;
  onSignOut: () => void;
  onViewBilling: () => void;
}) {
  const name = user?.name || user?.email || 'Account';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 transition-colors hover:border-border-strong"
          aria-label="Account menu"
        >
          {user?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.image} alt="" className="size-full object-cover" />
          ) : (
            <span className="tc-micro text-muted-foreground">
              {initials(String(name))}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[232px]">
        <div className="px-2 py-1.5">
          <p className="truncate tc-label text-foreground">{name}</p>
          {user?.email ? (
            <p className="tc-path truncate text-muted-foreground">{user.email}</p>
          ) : null}
          <p className="tc-path mt-1.5 text-muted-foreground">
            plan <span className="text-foreground">{planLabel}</span>
          </p>
        </div>
        <DropdownMenuSeparator />
        {/* The console's own billing screen, not the marketing page. Leaving
            the app to read your own plan was never the right trade. */}
        <DropdownMenuItem onClick={onViewBilling} className="gap-2">
          <Lineicons
            icon={CreditCardMultipleOutlined}
            size={13}
            aria-hidden="true"
            focusable="false"
          />
          Plan &amp; usage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="gap-2">
          <Lineicons icon={ExitOutlined} size={13} aria-hidden="true" focusable="false" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* The palette is the reason the sidebar can stay short: everything reachable
   is reachable from one keystroke, including switching bots, so the nav does
   not have to grow a row for every combination of screen and chatbot. */
function Palette({
  open,
  onOpenChange,
  page,
  onNavigate,
  chatbots,
  onSelectChatbot,
  onCreateChatbot,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  page: PageId;
  onNavigate: (id: PageId) => void;
  chatbots: any[];
  onSelectChatbot: (bot: any) => void;
  onCreateChatbot: () => void;
}) {
  const hasBot = chatbots.length > 0;

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a screen or a chatbot"
    >
      <CommandInput placeholder="Jump to a screen or a chatbot…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>

        <CommandGroup heading="Workspace">
          {WORKSPACE_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.path} ${item.hint}`}
              onSelect={() => run(() => onNavigate(item.id))}
            >
              <Lineicons icon={item.icon} size={14} aria-hidden="true" focusable="false" />
              <span className="flex-1">{item.label}</span>
              {page === item.id ? <span className="tc-path text-muted-foreground">current</span> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {hasBot ? (
          <CommandGroup heading="This chatbot">
            {AGENT_ITEMS.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.path} ${item.hint}`}
                onSelect={() => run(() => onNavigate(item.id))}
              >
                <Lineicons icon={item.icon} size={14} aria-hidden="true" focusable="false" />
                <span className="flex-1">{item.label}</span>
                {page === item.id ? <span className="tc-path text-muted-foreground">current</span> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Chatbots">
          {chatbots.map((bot: any) => (
            <CommandItem
              key={String(bot?.id)}
              value={`${bot?.name ?? ''} ${hostOf(bot)}`}
              onSelect={() => run(() => onSelectChatbot(bot))}
            >
              <span className="flex-1 truncate">{bot?.name ?? 'Untitled bot'}</span>
              <span className="tc-path truncate text-muted-foreground">{hostOf(bot)}</span>
            </CommandItem>
          ))}
          <CommandItem value="new chatbot create" onSelect={() => run(onCreateChatbot)}>
            <Lineicons icon={PlusOutlined} size={14} aria-hidden="true" focusable="false" />
            New chatbot
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* --------------------------------------------------------------------------
   The shell itself
   Credits live in the sidebar footer rather than the header, because credits
   are workspace state and the sidebar is where workspace state already is —
   the switcher, the workspace nav. That keeps the header purely utility and
   stops the same number appearing twice in one viewport.
   -------------------------------------------------------------------------- */

export function DashboardShell({
  page,
  onNavigate,
  chatbots,
  selectedChatbot,
  onSelectChatbot,
  onCreateChatbot,
  onSignOut,
  user,
  credits,
  loading,
  children,
}: {
  page: PageId;
  onNavigate: (id: PageId) => void;
  chatbots: any[];
  selectedChatbot: any | null;
  onSelectChatbot: (bot: any) => void;
  onCreateChatbot: () => void;
  onSignOut: () => void;
  user: { name?: string | null; email?: string | null; image?: string | null };
  credits: CreditState;
  loading?: boolean;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function navigate(id: PageId) {
    setDrawerOpen(false);
    onNavigate(id);
  }

  /* The rail and the drawer are one component. Passing `onClose` is what makes
     it a drawer: the collapse control becomes a close control, and width goes
     back to the parent, which is the only thing a drawer needs to differ on. */
  function rail(onClose?: () => void) {
    return (
      <SidebarNav
        page={page}
        onNavigate={navigate}
        chatbots={chatbots}
        selectedChatbot={selectedChatbot}
        onSelectChatbot={(bot) => {
          setDrawerOpen(false);
          onSelectChatbot(bot);
        }}
        onCreateChatbot={() => {
          setDrawerOpen(false);
          onCreateChatbot();
        }}
        credits={credits}
        loading={loading}
        onClose={onClose}
        className={
          onClose
            ? 'absolute inset-y-0 left-0 w-[min(84vw,17rem)] border-r border-border bg-background'
            : 'sticky top-0 hidden h-screen border-r border-border md:flex'
        }
      />
    );
  }

  /* One dialog for every "top up" in the console, mounted here because this is
     the highest point that has both the credit state and a way to navigate. */
  return (
    <TopUpProvider credits={credits} onViewPlans={() => navigate('billing')}>
      <div className="flex min-h-screen bg-background text-foreground">
        {rail()}

        {/* Mobile drawer. No spring, no blur: it slides, it stops. */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-foreground/20"
            />
            {rail(() => setDrawerOpen(false))}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Lineicons icon={MenuHamburger1Outlined} size={16} aria-hidden="true" focusable="false" />
            </Button>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-8 w-full max-w-[19rem] items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 text-left transition-colors hover:border-border-strong"
            >
              <Lineicons
                icon={Search1Outlined}
                size={14}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
                focusable="false"
              />
              <span className="flex-1 truncate text-sm text-muted-foreground">
                Search or jump to…
              </span>
              <Kbd>⌘K</Kbd>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <ThemeToggle />
              <UserMenu
                user={user}
                planLabel={credits.plan}
                onSignOut={onSignOut}
                onViewBilling={() => navigate('billing')}
              />
            </div>
          </header>

          <main className="flex-1 px-5 py-7 md:px-9 md:py-10">
            <div className="mx-auto w-full max-w-[1180px] space-y-8">{children}</div>
          </main>
        </div>

        <Palette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          page={page}
          onNavigate={navigate}
          chatbots={chatbots}
          onSelectChatbot={onSelectChatbot}
          onCreateChatbot={onCreateChatbot}
        />
      </div>
    </TopUpProvider>
  );
}
