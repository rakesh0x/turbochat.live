import {
  AirtableOutlined,
  Bell1Outlined,
  Code1Outlined,
  DiscordOutlined,
  Envelope1Outlined,
  FileMultipleOutlined,
  Globe1Outlined,
  GoogleDriveOutlined,
  GoogleOutlined,
  Headphone1Outlined,
  HubspotAiOutlined,
  MicrosoftTeamsOutlined,
  NotionOutlined,
  Search1Outlined,
  ShopifyOutlined,
  SlackOutlined,
  TelegramOutlined,
  WebhooksOutlined,
  WhatsappOutlined,
  WordpressOutlined,
  ZapierOutlined,
} from '@lineiconshq/free-icons';
import type { PageId } from '@/components/dashboard/nav';

/* ==========================================================================
   The connection registry
   --------------------------------------------------------------------------
   Integrations is the one screen that answers "what can this thing reach, and
   what can reach it". That question has a long tail, so the screen is driven
   by this list: adding a provider is a data change, and the day one ships it
   moves from `planned` to `live` with a `page` to send the reader to.

   Two rules keep it honest.

   `status: 'live'` means the product does this today and the reader can go do
   it now — every live row points at a screen that already exists. Everything
   else is `planned`, drawn as a dimmed tile rather than hidden, so the answer
   to "can it post to Slack?" is "not yet, and this is where it will appear"
   instead of a dead link or a toggle that lies.

   The grouping is by *direction*, not by vendor. A reader asking "how do I
   alert my team about a question we could not answer" should not have to know
   whether we filed that under Slack or under Notifications.
   ========================================================================== */

export type IntegrationStatus = 'live' | 'planned';

export type IntegrationGroupId = 'channel' | 'knowledge' | 'handoff' | 'automation';

export type Integration = {
  id: string;
  name: string;
  /** One line, in the reader's terms: what connecting this actually does. */
  note: string;
  icon: any;
  status: IntegrationStatus;
  group: IntegrationGroupId;
  /** Live rows only: the screen that owns the controls for this connection. */
  page?: PageId;
  /** Live rows only: the concrete artefact, shown mono beside the name. */
  detail?: string;
  /** Live rows only: true when the connection is per-chatbot, not per-account. */
  perChatbot?: boolean;
};

export type IntegrationGroup = {
  id: IntegrationGroupId;
  label: string;
  /** The question this group answers. Read as a sentence under the heading. */
  description: string;
  icon: any;
};

export const INTEGRATION_GROUPS: IntegrationGroup[] = [
  {
    id: 'channel',
    label: 'Channels',
    description: 'Where customers reach the bot.',
    icon: Globe1Outlined,
  },
  {
    id: 'knowledge',
    label: 'Knowledge sources',
    description: 'Where its answers come from.',
    icon: Search1Outlined,
  },
  {
    id: 'handoff',
    label: 'Handoff and alerts',
    description: 'Where a question goes when the bot cannot answer it.',
    icon: Bell1Outlined,
  },
  {
    id: 'automation',
    label: 'Automation',
    description: 'What the bot can trigger in your own tools.',
    icon: ZapierOutlined,
  },
];

export const INTEGRATIONS: Integration[] = [
  /* ---- channels ---------------------------------------------------------- */
  {
    id: 'website-widget',
    name: 'Website widget',
    note: 'One script tag on your own site. Works anywhere you can edit HTML.',
    icon: Code1Outlined,
    status: 'live',
    group: 'channel',
    page: 'deploy',
    detail: 'widget.js',
    perChatbot: true,
  },
  {
    id: 'hosted-page',
    name: 'Hosted share page',
    note: 'A public page we serve for you. No site to edit, no snippet.',
    icon: Globe1Outlined,
    status: 'live',
    group: 'channel',
    page: 'deploy',
    detail: '/share/:slug',
    perChatbot: true,
  },
  {
    id: 'slack-channel',
    name: 'Slack',
    note: 'Answer in a channel or a direct message.',
    icon: SlackOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'teams-channel',
    name: 'Microsoft Teams',
    note: 'A bot in Teams, on the same index as the website widget.',
    icon: MicrosoftTeamsOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    note: 'A business number that answers from your knowledge.',
    icon: WhatsappOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'discord',
    name: 'Discord',
    note: 'A bot user in your community server.',
    icon: DiscordOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    note: 'A Telegram bot pointed at one chatbot.',
    icon: TelegramOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    note: 'A plugin, so there are no theme files to edit.',
    icon: WordpressOutlined,
    status: 'planned',
    group: 'channel',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    note: 'A storefront app, with product data read straight from the catalogue.',
    icon: ShopifyOutlined,
    status: 'planned',
    group: 'channel',
  },

  /* ---- knowledge sources ------------------------------------------------- */
  {
    id: 'website-crawl',
    name: 'Website crawl',
    note: 'We read your pages and keep them as the bot’s knowledge.',
    icon: Search1Outlined,
    status: 'live',
    group: 'knowledge',
    page: 'knowledge',
    detail: 'sitemap + crawl',
    perChatbot: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    note: 'Sync a page tree, so docs stay the source of truth.',
    icon: NotionOutlined,
    status: 'planned',
    group: 'knowledge',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    note: 'Read a folder of docs and PDFs on a schedule.',
    icon: GoogleDriveOutlined,
    status: 'planned',
    group: 'knowledge',
  },
  {
    id: 'file-upload',
    name: 'File upload',
    note: 'Drop in PDFs, docs and CSVs that are not on the web.',
    icon: FileMultipleOutlined,
    status: 'planned',
    group: 'knowledge',
  },
  {
    id: 'airtable',
    name: 'Airtable',
    note: 'Answer from a table — prices, stock, plans — not just prose.',
    icon: AirtableOutlined,
    status: 'planned',
    group: 'knowledge',
  },

  /* ---- handoff and alerts ------------------------------------------------ */
  {
    id: 'email-alerts',
    name: 'Email alerts',
    note: 'A daily digest of questions nothing in the index covered.',
    icon: Envelope1Outlined,
    status: 'planned',
    group: 'handoff',
  },
  {
    id: 'slack-alerts',
    name: 'Slack alerts',
    note: 'Post unanswered questions into the channel your team watches.',
    icon: SlackOutlined,
    status: 'planned',
    group: 'handoff',
  },
  {
    id: 'helpdesk',
    name: 'Help desk',
    note: 'Open a ticket when the bot hands a conversation over.',
    icon: Headphone1Outlined,
    status: 'planned',
    group: 'handoff',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    note: 'Push a contact when a visitor leaves an address in the chat.',
    icon: HubspotAiOutlined,
    status: 'planned',
    group: 'handoff',
  },

  /* ---- automation -------------------------------------------------------- */
  {
    id: 'http-api',
    name: 'HTTP endpoint',
    note: 'Post a question, receive the answer. The same endpoint the widget calls.',
    icon: Code1Outlined,
    status: 'live',
    group: 'automation',
    page: 'deploy',
    detail: 'POST /api/chatbots/:id/chat',
    perChatbot: true,
  },
  {
    id: 'webhooks',
    name: 'Outbound webhooks',
    note: 'Fire a request of your own on every conversation or unanswered question.',
    icon: WebhooksOutlined,
    status: 'planned',
    group: 'automation',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    note: 'Wire conversations into anything without writing code.',
    icon: ZapierOutlined,
    status: 'planned',
    group: 'automation',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    note: 'Append a row per conversation, for the reporting you already have.',
    icon: GoogleOutlined,
    status: 'planned',
    group: 'automation',
  },
];

export const LIVE_INTEGRATIONS = INTEGRATIONS.filter((item) => item.status === 'live');

export function integrationsIn(group: IntegrationGroupId): Integration[] {
  /* Live first inside every group: the reader is looking for what they can do
     today, and the roadmap should never sit above it. */
  return INTEGRATIONS.filter((item) => item.group === group).sort((a, b) =>
    a.status === b.status ? 0 : a.status === 'live' ? -1 : 1,
  );
}
