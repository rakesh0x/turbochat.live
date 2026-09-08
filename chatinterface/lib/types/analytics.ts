/* The shape `/api/analytics` returns. Every field is counted from the
   `messages` table for the signed-in owner; anything the backend cannot
   measure comes back `null` rather than 0, and the UI draws an em dash. */

export interface AnalyticsPoint {
  date: string;
  messages: number;
  conversations?: number;
}

export interface AnalyticsTotals {
  messages: number;
  replies: number;
  conversations: number;
  /** Replies that had retrieved context behind them. */
  answered: number;
  /** Replies that fell through to "I don't have enough information". */
  unanswered: number;
  /** Replies written before groundedness was recorded. Excluded from the rate. */
  unmeasured: number;
  /** answered / (answered + unanswered), or null when nothing is measured yet. */
  answerRate: number | null;
  medianLatencyMs: number | null;
  activeDays: number;
  lastActiveAt: string | null;
}

export interface AnalyticsQuestion {
  question?: string;
  /** Legacy key from the previous stub response. */
  questions?: string;
  count: number;
  lastAskedAt?: string;
  chatbotId?: string;
}

export interface AnalyticsByChatbot {
  id: string;
  name: string;
  messages: number;
  conversations: number;
  answered: number;
  unanswered: number;
  answerRate: number | null;
  lastActiveAt: string | null;
}

export interface Analytics {
  range?: { days: number; from: string };
  chatbotId?: string | null;
  totals?: AnalyticsTotals;
  /** Legacy alias some callers still read first. */
  messageOverTime?: AnalyticsPoint[];
  messagesOverTime?: AnalyticsPoint[];
  topQuestions: AnalyticsQuestion[];
  unansweredQuestions?: AnalyticsQuestion[];
  byChatbot?: AnalyticsByChatbot[];
}

export interface Stats {
  totalChatbots: number;
  totalPages: number;
  trainingBots: number;
  totalMessages: number;
  activeBots?: number;
}

/** One thread in the inbox: the list row, not the transcript. */
export interface ConversationSummary {
  id: string;
  threadId: string;
  chatbotId: string;
  chatbotName?: string | null;
  /** The visitor's first message. Null when a thread somehow has none. */
  opener: string | null;
  messages: number;
  startedAt: string;
  lastActiveAt: string;
  /** At least one reply in the thread had no knowledge behind it. */
  unanswered: boolean;
  /** An address the visitor typed into the chat. Detected, never collected. */
  contactEmail: string | null;
}

export interface ConversationList {
  conversations: ConversationSummary[];
  counts: { all: number; unanswered: number; contacts: number };
  hasMore: boolean;
}

export interface TranscriptMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  grounded: boolean | null;
  latencyMs: number | null;
}

export interface ConversationTranscript {
  id: string;
  chatbotId: string;
  startedAt: string;
  lastActiveAt: string;
  messages: TranscriptMessage[];
}

export interface LogEntry {
  text: string;
  timestamp: string;
}
