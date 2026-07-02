import type { Message } from "./chat";

export interface MessageProps {
  role: "user" | "assistant" | string;
  children: React.ReactNode;
}

export interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}

export interface ThemeToggleProps {
  theme: string;
  setTheme:
    | React.Dispatch<React.SetStateAction<any>>
    | ((update: (t: string) => string) => void);
}

export interface SidebarSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
}

export interface SettingsPopoverProps {
  children: React.ReactNode;
}

export interface Action {
  icon: any; // LucideIcon or React.ComponentType
  label: string;
  badge?: string;
  action: () => void;
}

export interface ComposerActionsPopoverProps {
  children: React.ReactNode;
}

export interface ThinkingMessageProps {
  onPause: () => void;
}

export interface ComposerProps {
  onSend: (message: string) => Promise<void>;
  busy?: boolean;
}

export interface ComposerHandle {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
}

export interface ChatPaneProps {
  conversation?: any;
  onSend?: (content: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onResendMessage?: (messageId: string) => void;
  isThinking?: boolean;
  onPauseThinking?: () => void;
  streamingMessageId?: string | null;
}

export interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export interface DashboardPageProps {
  stats: any;
  chatbots: any[];
  loading: boolean;
  canCreateChatbot: boolean;
  onCreateChatbot: () => void;
  userProfile?: any;
  analytics?: any;
}

export interface FolderRowProps {
  name: string;
  count: number;
  conversations?: any[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  togglePin: (id: string) => void;
  onDeleteFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
}

export interface HeaderProps {
  createNewChat: () => void;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export interface TypingAnimationProps {
  text: string;
  duration?: number;
  showCursor?: boolean;
  blinkCursor?: boolean;
  cursorStyle?: "line" | "block" | "underscore";
  className?: string;
  onComplete?: () => void;
}

export interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTemplate: (template: any) => void;
  editingTemplate?: any | null;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: string | ((t: string) => string)) => void;
  collapsed: any;
  setCollapsed: React.Dispatch<React.SetStateAction<any>>;
  conversations: any[];
  pinned: any[];
  recent: any[];
  folders: any[];
  folderCounts: Record<string, number>;
  selectedId?: string;
  onSelect: (id: string) => void;
  togglePin: (id: string) => void;
  query: string;
  setQuery: (query: string) => void;
  searchRef?: React.RefObject<HTMLInputElement>;
  createFolder: (name: string) => void;
  createNewChat: () => void;
  templates?: any[];
  setTemplates?: (templates: any[]) => void;
  onUseTemplate?: (template: any) => void;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed?: (collapsed: boolean) => void;
}

export interface TemplateRowProps {
  template: any;
  onUseTemplate: (template: any) => void;
  onEditTemplate: (template: any) => void;
  onRenameTemplate: (id: string, newName: string) => void;
  onDeleteTemplate: (id: string) => void;
}

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: any[];
  selectedId?: string;
  onSelect: (id: string) => void;
  togglePin?: (id: string) => void;
  createNewChat: () => void;
}

export interface GhostIconButtonProps {
  label: string;
  children: React.ReactNode;
}

export interface ConversationRowProps {
  data: any;
  active: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  showMeta: boolean;
}

export interface MyChatbotsPageProps {
  chatbots: any[];
  loading: boolean;
  onSelectChatbot: (bot: any) => void;
  onRefresh: () => void;
  canCreateChatbot: boolean;
  onCreateChatbot: () => void;
}

export interface PlaygroundPageProps {
  chatbot: any;
}

export interface DeployPageProps {
  chatbot: any;
}

export interface CreateChatbotPageProps {
  onComplete: (createdBot: any) => void;
  canCreateChatbot: boolean;
  remainingCredits: number;
  remainingFreeTrials: number;
  onBlocked: () => void;
}

export interface BillingPageProps {
  userProfile: any;
  stats: any;
  chatbotCount: number;
}

export interface TrainingPageProps {
  chatbot?: any;
}
