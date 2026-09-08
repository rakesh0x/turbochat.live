'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  AngleDoubleLeftOutlined,
  AngleDoubleRightOutlined,
  CheckOutlined,
  ChevronDownOutlined,
  PlusOutlined,
  Search1Outlined,
  XmarkOutlined,
} from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand/logo';
import GlideMenu from '@/components/primitives/GlideMenu';
import { hostOf, initials } from './kit';
import { useTopUp } from './topup-context';
import { CreditMeter, type CreditState } from './upsell';
import { AGENT_ITEMS, WORKSPACE_ITEMS, type NavItem, type PageId } from './nav';

/* ==========================================================================
   The rail
   --------------------------------------------------------------------------
   Where you can go, which chatbot you are looking at, and what is running
   out. Three things, in that order, because that is the order a reader needs
   them in — a destination is useless if you cannot tell whose numbers it will
   show you, and both are useless once the credits are gone.

   Three mechanics carry it:

     collapse   the rail animates its own width and nothing inside it moves.
                Copy fades toward the edge it is leaving and rows shrink to
                the icon's own box, but the icon stays on the same pixel it
                occupied at full width. That is the whole trick: it reads as
                one rail getting narrower, not a second rail appearing.

     glide      one highlight travels between rows instead of eight
                backgrounds blinking independently. See GlideMenu.

     search     the field grows right-to-left out of the magnifier that
                summoned it, so the control that was clicked becomes the
                control being typed into.

   The active row keeps its 2px ink rail on top of the tonal fill. With a
   single shared highlight doing hover, the fill alone can no longer say
   "you are here" — hover and current would paint identically.
   ========================================================================== */

const SIDEBAR_MOTION = {
  expandedWidth: 264,
  collapsedWidth: 56,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

/* ─────────────────────────────────────────────────────────
 * NAV SEARCH STORYBOARD
 *
 *   0ms   search is triggered; the group label begins fading
 *   0ms   field grows right → left from the search control
 * 180ms   field fills the row; cursor is focused and ready
 * ───────────────────────────────────────────────────────── */
const NAV_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

/* Rows breathe. The rail this replaced packed 32px rows two pixels apart,
   which made six destinations read as one striped block rather than six
   places you could go. */
const ROW_GAP = 'gap-1';
const GROUP_GAP = 'mt-7';

/* The marker tick that used to stand in here is gone: the mark carries the
   marker now, and two of them on one row would be one accent too many. */
function Brand() {
  return <BrandLogo className="text-[1.0625rem]" />;
}

function GlideGroup({ children }: { children: ReactNode }) {
  return (
    <GlideMenu
      rowSelector="[data-row]"
      highlightClassName="sidebar-glide-highlight rounded-md bg-accent"
      className={cn('group/glide flex flex-col', ROW_GAP)}
    >
      {children}
    </GlideMenu>
  );
}

/* --------------------------------------------------------------------------
   A destination
   -------------------------------------------------------------------------- */

function NavRow({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onSelect}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'sidebar-row relative z-10 mx-2 flex h-9 items-center rounded-md px-2 text-left',
        'transition-[width,background-color,color,transform] duration-150 active:scale-[0.99]',
        'after:absolute after:left-0 after:top-1/2 after:h-4 after:w-[2px] after:-translate-y-1/2 after:rounded-full after:transition-colors',
        active
          ? 'bg-accent text-foreground after:bg-foreground group-hover/glide:bg-transparent'
          : 'text-muted-foreground after:bg-transparent hover:text-foreground',
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <Lineicons icon={item.icon} size={15} aria-hidden="true" focusable="false" />
      </span>
      <span
        className={cn(
          'sidebar-copy ml-2 min-w-0 flex-1 truncate text-sm',
          active && 'font-medium',
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------------
   The chatbot switcher
   The most important control in the rail. It sits directly above the agent
   nav group so the relationship reads without a label: this bot, these
   screens. Its trigger shows the host, not just the name, because a customer
   with "Docs" and "Docs (staging)" needs the domain to tell them apart.

   It is a portal rather than a popover so the rail can clip its own overflow
   through the collapse animation without clipping the open menu with it.
   -------------------------------------------------------------------------- */

function ChatbotMenu({
  position,
  chatbots,
  selected,
  onSelect,
  onCreate,
  onClose,
}: {
  position: { top: number; left: number };
  chatbots: any[];
  selected: any | null;
  onSelect: (bot: any) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return createPortal(
    <div
      data-chatbot-menu
      className="tc-raise fixed z-50 w-[248px] rounded-xl border border-border bg-popover p-1.5"
      style={{
        top: position.top,
        left: position.left,
        animation: 'tc-pop-in 180ms cubic-bezier(0.23,1,0.32,1) both',
        transformOrigin: 'top left',
      }}
    >
      <GlideMenu className="flex flex-col gap-px" highlightClassName="rounded-md bg-accent">
        <p className="tc-eyebrow px-2 pb-1 pt-1">Chatbots</p>

        {chatbots.map((bot: any) => {
          const active = String(bot?.id) === String(selected?.id);
          const name = String(bot?.name ?? 'Untitled bot');
          const host = hostOf(bot);
          return (
            <button
              key={String(bot?.id)}
              data-menu-row
              type="button"
              onClick={() => {
                onSelect(bot);
                onClose();
              }}
              className="relative z-10 flex h-10 w-full items-center gap-2 rounded-md px-2 text-left"
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-plate tc-micro text-plate-foreground"
              >
                {initials(name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate tc-label text-foreground">
                  {name}
                </span>
                {host ? (
                  <span className="tc-path block truncate leading-4 text-muted-foreground">{host}</span>
                ) : null}
              </span>
              {active ? (
                <Lineicons
                  icon={CheckOutlined}
                  size={14}
                  className="shrink-0 text-signal"
                  aria-hidden="true"
                  focusable="false"
                />
              ) : null}
            </button>
          );
        })}

        <div className="my-1 h-px bg-border" />

        <button
          data-menu-row
          type="button"
          onClick={() => {
            onCreate();
            onClose();
          }}
          className="relative z-10 flex h-9 w-full items-center gap-2 rounded-md px-2 text-left"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            <Lineicons icon={PlusOutlined} size={14} aria-hidden="true" focusable="false" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">New chatbot</span>
        </button>
      </GlideMenu>
    </div>,
    document.body,
  );
}

function ChatbotSwitcher({
  chatbots,
  selected,
  onSelect,
  onCreate,
  loading,
  collapsed,
}: {
  chatbots: any[];
  selected: any | null;
  onSelect: (bot: any) => void;
  onCreate: () => void;
  loading?: boolean;
  /* Collapsed, the trigger keeps working as a monogram. A rail that loses the
     ability to change bots is a rail you have to expand before you can use. */
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-chatbot-trigger]') && !target.closest('[data-chatbot-menu]')) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((prev) => !prev);
  }

  if (loading) {
    return (
      <span
        className={cn(
          'tc-shimmer block rounded-lg bg-surface-2',
          collapsed ? 'size-9' : 'h-11 w-full',
        )}
      />
    );
  }

  /* Nothing to switch between yet, so the control becomes the invitation. */
  if (chatbots.length === 0) {
    return collapsed ? (
      <button
        type="button"
        onClick={onCreate}
        aria-label="New chatbot"
        title="New chatbot"
        className="tc-lift flex size-9 items-center justify-center rounded-lg border border-dashed border-border-strong bg-card text-muted-foreground"
      >
        <Lineicons icon={PlusOutlined} size={13} aria-hidden="true" focusable="false" />
      </button>
    ) : (
      <button
        type="button"
        onClick={onCreate}
        className="tc-lift flex h-11 w-full items-center gap-2.5 rounded-lg border border-dashed border-border-strong bg-card px-3 text-left"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2">
          <Lineicons icon={PlusOutlined} size={12} aria-hidden="true" focusable="false" />
        </span>
        <span className="min-w-0 flex-1 truncate tc-label text-foreground">
          New chatbot
        </span>
      </button>
    );
  }

  const host = hostOf(selected);
  const name = String(selected?.name ?? 'Untitled bot');

  if (collapsed) {
    return (
      <>
        <button
          ref={triggerRef}
          data-chatbot-trigger
          type="button"
          aria-expanded={open}
          aria-label={`Chatbot: ${name}`}
          title={host ? `${name} · ${host}` : name}
          onClick={toggle}
          className="tc-lift flex size-9 items-center justify-center rounded-lg border border-border bg-card"
        >
          <span aria-hidden="true" className="tc-micro text-foreground">
            {initials(name)}
          </span>
        </button>

        {open ? (
          <ChatbotMenu
            position={position}
            chatbots={chatbots}
            selected={selected}
            onSelect={onSelect}
            onCreate={onCreate}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        data-chatbot-trigger
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="tc-lift flex h-11 w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-left"
      >
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-plate tc-micro text-plate-foreground"
        >
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate tc-label text-foreground">
            {name}
          </span>
          {host ? (
            <span className="tc-path block truncate leading-4 text-muted-foreground">{host}</span>
          ) : null}
        </span>
        <Lineicons
          icon={ChevronDownOutlined}
          size={13}
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
          focusable="false"
        />
      </button>

      {open ? (
        <ChatbotMenu
          position={position}
          chatbots={chatbots}
          selected={selected}
          onSelect={onSelect}
          onCreate={onCreate}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

/* --------------------------------------------------------------------------
   The rail itself
   Credits live here rather than in the header, because credits are workspace
   state and the rail is where workspace state already is — the switcher, the
   workspace nav. That keeps the header purely utility and stops the same
   number appearing twice in one viewport.
   -------------------------------------------------------------------------- */

export type SidebarNavProps = {
  page: PageId;
  onNavigate: (id: PageId) => void;
  chatbots: any[];
  selectedChatbot: any | null;
  onSelectChatbot: (bot: any) => void;
  onCreateChatbot: () => void;
  credits: CreditState;
  loading?: boolean;
  className?: string;
  /** Drawer mode: the header's right control closes instead of collapsing. */
  onClose?: () => void;
};

export function SidebarNav({
  page,
  onNavigate,
  chatbots,
  selectedChatbot,
  onSelectChatbot,
  onCreateChatbot,
  credits,
  loading,
  className,
  onClose,
}: SidebarNavProps) {
  const topUp = useTopUp();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  /* A drawer is already as narrow as it is going to get, and its width is the
     parent's business, so collapse is a rail-only affordance. */
  const drawer = typeof onClose === 'function';
  const isCollapsed = !drawer && collapsed;

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const term = query.trim().toLowerCase();
  const searching = term.length > 0;
  const matches = (item: NavItem) =>
    item.label.toLowerCase().includes(term) || item.path.toLowerCase().includes(term);

  const hasBot = chatbots.length > 0;
  const workspaceItems = WORKSPACE_ITEMS.filter(matches);
  const agentItems = hasBot ? AGENT_ITEMS.filter(matches) : [];
  const nothingMatched = searching && workspaceItems.length === 0 && agentItems.length === 0;

  function collapse() {
    setCollapsed(true);
    setSearchOpen(false);
    setQuery('');
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  return (
    <aside
      data-sidebar-collapsed={isCollapsed}
      aria-label="Workspace navigation"
      className={cn('relative flex flex-col overflow-hidden transition-[width]', className)}
      style={
        {
          width: drawer
            ? undefined
            : isCollapsed
              ? SIDEBAR_MOTION.collapsedWidth
              : SIDEBAR_MOTION.expandedWidth,
          transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
          transitionTimingFunction: SIDEBAR_MOTION.easing,
          '--sidebar-copy-duration': `${SIDEBAR_MOTION.copyDuration}ms`,
          '--sidebar-copy-offset': `${SIDEBAR_MOTION.copyOffset}px`,
          '--sidebar-easing': SIDEBAR_MOTION.easing,
        } as CSSProperties
      }
    >
      {/* Laid out at full width and clipped by the aside, so nothing inside
          reflows while the width animates. */}
      <div className={cn('flex min-h-0 flex-1 flex-col', drawer ? 'w-full' : 'w-[264px] shrink-0')}>
        <div className="relative h-14 shrink-0 border-b border-border">
          <a
            href="/"
            aria-label="turbochat home"
            aria-hidden={isCollapsed}
            tabIndex={isCollapsed ? -1 : 0}
            className="sidebar-copy absolute left-4 top-3 flex h-8 items-center"
          >
            <Brand />
          </a>

          {drawer ? (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            >
              <Lineicons icon={XmarkOutlined} size={15} aria-hidden="true" focusable="false" />
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-label="Collapse sidebar"
                aria-hidden={isCollapsed}
                tabIndex={isCollapsed ? -1 : 0}
                onClick={collapse}
                className="sidebar-collapse-control absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[opacity,background-color,color] duration-150 hover:bg-accent hover:text-foreground"
              >
                <Lineicons
                  icon={AngleDoubleLeftOutlined}
                  size={15}
                  aria-hidden="true"
                  focusable="false"
                />
              </button>
              <button
                type="button"
                aria-label="Expand sidebar"
                aria-hidden={!isCollapsed}
                tabIndex={isCollapsed ? 0 : -1}
                onClick={() => setCollapsed(false)}
                className="sidebar-expand-control absolute left-3 top-3 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[opacity,background-color,color] duration-150 hover:bg-accent hover:text-foreground"
              >
                <Lineicons
                  icon={AngleDoubleRightOutlined}
                  size={15}
                  aria-hidden="true"
                  focusable="false"
                />
              </button>
            </>
          )}
        </div>

        <div className="tc-scrollbar-none min-h-0 flex-1 overflow-y-auto py-4">
          {/* The group label and the search field share one 32px slot: the
              label fades out, the field grows in from the right. A dedicated
              search row would push every nav row down by 32px for a control
              that is used rarely. */}
          <div className="sidebar-copy relative mx-2 mb-2 h-8">
            <div
              aria-hidden={searchOpen}
              className={cn(
                'absolute inset-y-0 left-0 right-9 flex items-center px-2 transition-opacity',
                searchOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
              )}
              style={{
                transitionDuration: `${NAV_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: NAV_SEARCH_MOTION.easing,
              }}
            >
              <p className="tc-eyebrow truncate">Workspace</p>
            </div>

            <div
              className="absolute inset-y-0 right-1 flex items-center overflow-hidden transition-[width]"
              style={{
                width: searchOpen ? 'calc(100% - 0.25rem)' : `${NAV_SEARCH_MOTION.closedWidth}px`,
                transitionDuration: `${NAV_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: NAV_SEARCH_MOTION.easing,
              }}
            >
              {searchOpen ? (
                <div className="flex h-8 w-full items-center gap-1.5 rounded-md border border-border bg-surface-2 pl-2 pr-1">
                  <Lineicons
                    icon={Search1Outlined}
                    size={13}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                    focusable="false"
                  />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.stopPropagation();
                        closeSearch();
                      }
                    }}
                    placeholder="Find a screen"
                    aria-label="Find a screen"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={closeSearch}
                    className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                  >
                    <Lineicons icon={XmarkOutlined} size={12} aria-hidden="true" focusable="false" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Find a screen"
                  aria-hidden={isCollapsed}
                  tabIndex={isCollapsed ? -1 : 0}
                  onClick={() => setSearchOpen(true)}
                  className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                >
                  <Lineicons icon={Search1Outlined} size={14} aria-hidden="true" focusable="false" />
                </button>
              )}
            </div>
          </div>

          {workspaceItems.length > 0 ? (
            <GlideGroup>
              {workspaceItems.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  active={page === item.id}
                  onSelect={() => {
                    onNavigate(item.id);
                    closeSearch();
                    onClose?.();
                  }}
                />
              ))}
            </GlideGroup>
          ) : null}

          {/* The agent group is hidden entirely while a search excludes all of
              it, so the switcher does not sit above four empty rows. */}
          {!searching || agentItems.length > 0 ? (
            <div className={GROUP_GAP}>
              <p className="sidebar-copy tc-eyebrow mx-2 mb-2 px-2">
                {hasBot ? 'This chatbot' : 'Chatbot'}
              </p>
              <div className="mx-2 mb-2">
                <ChatbotSwitcher
                  chatbots={chatbots}
                  selected={selectedChatbot}
                  onSelect={(bot) => {
                    onSelectChatbot(bot);
                    closeSearch();
                  }}
                  onCreate={() => {
                    onCreateChatbot();
                    onClose?.();
                  }}
                  loading={Boolean(loading)}
                  collapsed={isCollapsed}
                />
              </div>

              {agentItems.length > 0 ? (
                <GlideGroup>
                  {agentItems.map((item) => (
                    <NavRow
                      key={item.id}
                      item={item}
                      active={page === item.id}
                      onSelect={() => {
                        onNavigate(item.id);
                        closeSearch();
                        onClose?.();
                      }}
                    />
                  ))}
                </GlideGroup>
              ) : null}

              {!hasBot && !loading && !searching ? (
                <p className="sidebar-copy mx-2 px-2 tc-meta text-muted-foreground">
                  Point one at your site and its knowledge, playground, deploy and analytics screens
                  appear here.
                </p>
              ) : null}
            </div>
          ) : null}

          {nothingMatched ? (
            <p className="sidebar-copy mx-2 px-2 py-1 text-sm text-muted-foreground">
              No screen matches “{query.trim()}”.
            </p>
          ) : null}
        </div>

        {/* Collapsed, the footer keeps the bar and drops the digits: a draining
            bar still reads at 32px, a "12 / 100" does not. */}
        {isCollapsed ? (
          <div className="shrink-0 border-t border-border px-3 py-4">
            <button
              type="button"
              onClick={() => topUp.open('rail-footer-collapsed')}
              aria-label={`Credits: ${credits.credits === null ? 'unknown' : credits.credits.toLocaleString()}. Add credits`}
              title={`Credits: ${credits.credits === null ? '—' : credits.credits.toLocaleString()}`}
              className="block w-8"
            >
              <span
                className="tc-meter block w-full"
                data-level={credits.level}
                style={{ ['--tc-fill' as any]: `${credits.pct}%` }}
                aria-hidden="true"
              >
                <span className="tc-meter-bar" />
              </span>
            </button>
          </div>
        ) : (
          <div className="shrink-0 border-t border-border px-3 py-3.5">
            <CreditMeter state={credits} />
            {/* Opens the credits dialog in place. This used to be an anchor to
                /pricing, which meant a full page load out of the console and
                onto the marketing site — the reader lost the screen they were
                on to be sold a product they had already bought. */}
            {credits.level === 'ok' ? null : (
              <button
                type="button"
                onClick={() => topUp.open('rail-footer')}
                className={cn(
                  'sidebar-copy tc-label mt-3 flex h-8 w-full items-center justify-center rounded-md border text-foreground transition-colors duration-150',
                  credits.level === 'empty'
                    ? 'border-danger-border bg-danger-soft hover:border-border-strong'
                    : 'border-warning-border bg-warning-soft hover:border-border-strong',
                )}
              >
                {credits.level === 'empty' ? 'Out of credits — top up' : 'Running low — top up'}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
