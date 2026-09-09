/* ==========================================================================
   Derivations
   --------------------------------------------------------------------------
   The small facts every console screen needs and three of them had each
   grown their own copy of: which statuses count as answering, how to get a
   host out of whatever shape the API used for the URL this week, how to say a
   date in a table. Nothing here fetches or renders — it only reads.

   Kept deliberately thin. This is not a data layer; it is the set of one-line
   answers that must not disagree between Overview, Chatbots and Analytics.
   ========================================================================== */

/** Statuses that mean the bot will answer a customer right now. */
export const LIVE_STATUSES = new Set(['active', 'live', 'ready', 'trained', 'completed']);
/** Statuses that mean the server is still working on it. */
export const WORKING_STATUSES = new Set(['training', 'crawling', 'indexing', 'pending', 'processing']);
/** Statuses that mean a human has to do something. */
export const FAILED_STATUSES = new Set(['error', 'failed']);

export function statusOf(bot: any): string {
  return String(bot?.status ?? '').toLowerCase();
}

export function isLive(bot: any): boolean {
  return LIVE_STATUSES.has(statusOf(bot));
}

export function isWorking(bot: any): boolean {
  return WORKING_STATUSES.has(statusOf(bot));
}

export function isFailed(bot: any): boolean {
  return FAILED_STATUSES.has(statusOf(bot));
}

export function botId(bot: any): string | null {
  const raw = bot?.id ?? bot?._id ?? null;
  return raw === null || raw === undefined ? null : String(raw);
}

/** The bot's source, as a bare host. Four API shapes have carried this field. */
export function hostOf(bot: any): string {
  const raw = String(bot?.website ?? bot?.website_url ?? bot?.websiteUrl ?? bot?.url ?? '');
  if (!raw) return '';
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).host.replace(/^www\./, '');
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

export function shortDate(raw: unknown): string {
  const parsed = new Date(String(raw ?? ''));
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Coarse and deliberately so: an inbox row wants "2h", not a timestamp. */
export function relativeTime(raw: unknown): string {
  const parsed = new Date(String(raw ?? ''));
  if (Number.isNaN(parsed.getTime())) return '—';
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(raw);
}

/** A percentage for display. Null in, em dash out — never a stand-in zero. */
export function percent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  return `${Math.round(ratio * 100)}%`;
}

export function seconds(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 950) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** First sentence or so of a customer message, for a one-line row. */
export function excerpt(text: unknown, max = 110): string {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trimEnd()}…`;
}

export type Point = { date: string; messages: number; conversations?: number };

/** Two halves of the window compared. Null when there is nothing to compare,
    so a tile can stay silent instead of claiming flat growth. */
export function trendOf(series: Point[], unit = 'day'): {
  percent: number;
  rising: boolean;
  note: string;
} | null {
  if (series.length < 4) return null;
  const mid = Math.floor(series.length / 2);
  const before = series.slice(0, mid).reduce((sum, p) => sum + (Number(p.messages) || 0), 0);
  const after = series.slice(mid).reduce((sum, p) => sum + (Number(p.messages) || 0), 0);
  if (before === 0) return null;
  const change = Math.round(((after - before) / before) * 100);
  if (change === 0) return null;
  return {
    percent: Math.abs(change),
    rising: change > 0,
    note: `vs previous ${mid} ${mid === 1 ? unit : `${unit}s`}`,
  };
}
