export interface Analytics {
  messageOverTime?: Array<{ date: string; messages: number }>;
  messagesOverTime?: Array<{ date: string; messages: number }>;
  topQuestions: Array<{
    question?: string;
    questions?: string;
    count: number;
  }>;
}

export interface Stats {
  totalChatbots: number;
  totalPages: number;
  trainingBots: number;
  totalMessages: number;
}

export interface LogEntry {
  text: string;
  timestamp: string;
}
