import {
  BarChart4Outlined,
  BotpressOutlined,
  Comment1TextOutlined,
  CreditCardMultipleOutlined,
  DashboardSquare1Outlined,
  Database2Outlined,
  Gear1Outlined,
  PlayOutlined,
  Plug1Outlined,
  Rocket5Outlined,
} from '@lineiconshq/free-icons';

/* ==========================================================================
   The nav model
   --------------------------------------------------------------------------
   One list, three consumers: the sidebar, the command palette, and the URL.
   Keeping them from drifting apart is the entire reason this file exists.

   The split that matters is scope: six screens are about *the workspace* and
   four are about *one chatbot*. Every agent screen used to silently fall back
   to `chatbots[0]`, so a reader with four bots could not tell whose numbers
   they were reading. Splitting the list by scope makes the switcher above the
   agent group load-bearing instead of decorative.
   ========================================================================== */

export type NavScope = 'workspace' | 'agent';

export type PageId =
  | 'dashboard'
  | 'inbox'
  | 'chatbots'
  | 'analytics'
  | 'integrations'
  | 'billing'
  | 'knowledge'
  | 'playground'
  | 'deploy'
  | 'settings';

export type NavItem = {
  id: PageId;
  label: string;
  /** The mono path eyebrow: the screen's place in the pipeline, not a route. */
  path: string;
  icon: any;
  /** Second line in the command palette. Says what the screen is *for*. */
  hint: string;
  scope: NavScope;
};

/* Workspace screens are ordered by how often a running account opens them:
   what happened, who asked, which bot, why, what it is connected to, what it
   costs. Agent screens stay in pipeline order — what the bot knows, what it
   answers, where it lives, how it is configured.

   Two rows are new, and both earn their place by owning data no other screen
   can show. Conversations is the only view of the `messages` table, which the
   product has always written and never displayed. Integrations is the only
   place that answers "what can this thing reach", and is driven by a registry
   so a new provider is a data change.

   Analytics moved from agent scope to workspace scope. It was reading
   account-wide totals while sitting under a single-chatbot switcher, so a
   reader with four bots saw one bot's name above every other bot's numbers.
   It now scopes itself explicitly, and Overview keeps the "what happened"
   question while Analytics answers "why".

   "Create chatbot" is deliberately absent. It is an action, not a place, and
   it lives where the reader already is: the switcher and the Chatbots screen. */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    path: '/overview',
    icon: DashboardSquare1Outlined,
    hint: 'What happened today, and what needs you',
    scope: 'workspace',
  },
  {
    id: 'inbox',
    label: 'Conversations',
    path: '/inbox',
    icon: Comment1TextOutlined,
    hint: 'Every customer thread, and the ones that went unanswered',
    scope: 'workspace',
  },
  {
    id: 'chatbots',
    label: 'Chatbots',
    path: '/agents',
    icon: BotpressOutlined,
    hint: 'Every bot in this workspace and its status',
    scope: 'workspace',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/measure',
    icon: BarChart4Outlined,
    hint: 'Volume, answer rate and the questions nothing covered',
    scope: 'workspace',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: '/connect',
    icon: Plug1Outlined,
    hint: 'Where the chatbot is reachable and what it can reach',
    scope: 'workspace',
  },
  {
    id: 'billing',
    label: 'Plan & usage',
    path: '/billing',
    icon: CreditCardMultipleOutlined,
    hint: 'Credits, invoices and what the current plan allows',
    scope: 'workspace',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    path: '/index',
    icon: Database2Outlined,
    hint: 'The pages this bot has read, and what to add next',
    scope: 'agent',
  },
  {
    id: 'playground',
    label: 'Playground',
    path: '/answer',
    icon: PlayOutlined,
    hint: 'Ask the bot something and see which page it cites',
    scope: 'agent',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    path: '/embed',
    icon: Rocket5Outlined,
    hint: 'Embed snippet, share link and install checks',
    scope: 'agent',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/configure',
    icon: Gear1Outlined,
    hint: 'Name, model, tone and removal',
    scope: 'agent',
  },
];

export const WORKSPACE_ITEMS = NAV_ITEMS.filter((item) => item.scope === 'workspace');
export const AGENT_ITEMS = NAV_ITEMS.filter((item) => item.scope === 'agent');

export const DEFAULT_PAGE: PageId = 'dashboard';

const BY_ID = new Map<PageId, NavItem>(NAV_ITEMS.map((item) => [item.id, item]));

/** Ids that shipped before the rename, so old links and bookmarks still land. */
const ALIASES: Record<string, PageId> = {
  overview: 'dashboard',
  home: 'dashboard',
  training: 'knowledge',
  data: 'knowledge',
  create: 'chatbots',
  setting: 'settings',
  agents: 'chatbots',
  conversations: 'inbox',
  leads: 'inbox',
  channels: 'deploy',
  integration: 'integrations',
  connect: 'integrations',
};

export function resolvePage(value: unknown): PageId | null {
  const raw = String(value ?? '').toLowerCase();
  if (BY_ID.has(raw as PageId)) return raw as PageId;
  return ALIASES[raw] ?? null;
}

export function navItem(id: PageId): NavItem {
  return BY_ID.get(id) ?? NAV_ITEMS[0];
}

export function pageLabel(id: PageId): string {
  return navItem(id).label;
}

export function isAgentPage(id: PageId): boolean {
  return navItem(id).scope === 'agent';
}
