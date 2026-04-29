export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  editedAt?: string;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: string | Date;
  folder?: string | null;
  pinned?: boolean;
  messageCount?: number;
  messages?: Message[];
}

export interface ConversationData {
  id: string;
  title: string;
  messages?: any[];
  messageCount?: number;
  pinned?: boolean;
  updatedAt: string | Date;
  preview: string;
}

export interface Template {
  id: string;
  name: string;
  content?: string;
  snippet: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chatbot {
  id?: string;
  name: string;
  icon?: string | React.ReactNode;
  badge?: string | null;
  website?: string;
  status?: "active" | "inactive" | "training";
  pagesScraped?: number;
  monthlyMessages?: number;
  lastUpdated?: string;
  model?: string;
}

export interface Folder {
  id: string;
  name: string;
}
