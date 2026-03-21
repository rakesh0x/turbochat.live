"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
    PanelLeftClose,
    PanelLeftOpen,
    SearchIcon,
    Plus,
    Star,
    Clock,
    FolderIcon,
    FileText,
    Settings,
    Asterisk,
} from "lucide-react"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import FolderRow from "./FolderRow"
import TemplateRow from "./TemplateRow"
import ThemeToggle from "./ThemeToggle"
import CreateFolderModal from "./CreateFolderModal"
import CreateTemplateModal from "./CreateTemplateModal"
import SearchModal from "./SearchModal"
import SettingsPopover from "./SettingsPopover"
import { cls } from "./utils"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Conversation {
    id: string;
    title: string;
    preview: string;
    updatedAt: string | Date;
    folder?: string | null;
    pinned?: boolean;
}

interface Folder {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
    snippet: string;
    updatedAt?: string;
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    theme: string;
    setTheme: (theme: string | ((t: string) => string)) => void;
    collapsed: {
        pinned: boolean;
        recent: boolean;
        folders: boolean;
        templates: boolean;
    };
    setCollapsed: React.Dispatch<React.SetStateAction<any>>;
    conversations: Conversation[];
    pinned: Conversation[];
    recent: Conversation[];
    folders: Folder[];
    folderCounts: Record<string, number>;
    selectedId?: string;
    onSelect: (id: string) => void;
    togglePin: (id: string) => void;
    query: string;
    setQuery: (query: string) => void;
    searchRef?: React.RefObject<HTMLInputElement>;
    createFolder: (name: string) => void;
    createNewChat: () => void;
    templates?: Template[];
    setTemplates?: (templates: Template[]) => void;
    onUseTemplate?: (template: Template) => void;
    sidebarCollapsed?: boolean;
    setSidebarCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({
    open,
    onClose,
    theme,
    setTheme,
    collapsed,
    setCollapsed,
    conversations,
    pinned,
    recent,
    folders,
    folderCounts,
    selectedId,
    onSelect,
    togglePin,
    query,
    setQuery,
    searchRef,
    createFolder,
    createNewChat,
    templates = [],
    setTemplates = () => { },
    onUseTemplate = () => { },
    sidebarCollapsed = false,
    setSidebarCollapsed = () => { },
}: SidebarProps) {
    const isMobile = useIsMobile()
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
    const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [showSearchModal, setShowSearchModal] = useState(false)

    const handleSearchClick = () => {
        setShowSearchModal(true)
    }

    const handleNewChatClick = () => {
        createNewChat()
    }

    const handleFoldersClick = () => {
        setSidebarCollapsed?.(false)
        setCollapsed((s: any) => ({ ...s, folders: false }))
    }

    const getConversationsByFolder = (folderName: string) => {
        return conversations.filter((conv) => conv.folder === folderName)
    }

    const handleCreateFolder = (folderName: string) => {
        createFolder(folderName)
    }

    const handleDeleteFolder = (folderName: string) => {
        const updatedConversations = conversations.map((conv) =>
            conv.folder === folderName ? { ...conv, folder: null } : conv,
        )
        console.log("Delete folder:", folderName, "Updated conversations:", updatedConversations)
    }

    const handleRenameFolder = (oldName: string, newName: string) => {
        const updatedConversations = conversations.map((conv) =>
            conv.folder === oldName ? { ...conv, folder: newName } : conv,
        )
        console.log("Rename folder:", oldName, "to", newName, "Updated conversations:", updatedConversations)
    }

    const handleCreateTemplate = (templateData: Omit<Template, 'id'>) => {
        if (editingTemplate) {
            const updatedTemplates = templates.map((t) =>
                t.id === editingTemplate.id ? { ...templateData, id: editingTemplate.id } : t,
            )
            setTemplates(updatedTemplates)
            setEditingTemplate(null)
        } else {
            const newTemplate: Template = {
                ...templateData,
                id: Date.now().toString(),
            }
            setTemplates([...templates, newTemplate])
        }
        setShowCreateTemplateModal(false)
    }

    const handleEditTemplate = (template: Template) => {
        setEditingTemplate(template)
        setShowCreateTemplateModal(true)
    }

    const handleRenameTemplate = (templateId: string, newName: string) => {
        const updatedTemplates = templates.map((t) =>
            t.id === templateId ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t,
        )
        setTemplates(updatedTemplates)
    }

    const handleDeleteTemplate = (templateId: string) => {
        const updatedTemplates = templates.filter((t) => t.id !== templateId)
        setTemplates(updatedTemplates)
    }

    const handleUseTemplate = (template: Template) => {
        onUseTemplate(template)
    }

    const shouldRenderSidebar = !isMobile || open

    if (sidebarCollapsed) {
        return (
            <>
                <motion.aside
                    initial={{ width: 320 }}
                    animate={{ width: 68 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="z-50 flex h-full shrink-0 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-premium dark:shadow-none"
                >
                    <div className="flex items-center justify-center border-b border-border/50 px-3 py-4">
                        <button
                            onClick={() => setSidebarCollapsed?.(false)}
                            className="rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                            aria-label="Open sidebar"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-1.5 pt-4 px-2">
                        <button
                            onClick={handleNewChatClick}
                            className="w-full rounded-xl p-2.5 gradient-primary text-white shadow-sm hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                            title="New Chat"
                        >
                            <Plus className="h-5 w-5 mx-auto" />
                        </button>

                        <button
                            onClick={handleSearchClick}
                            className="w-full rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                            title="Search chats"
                        >
                            <SearchIcon className="h-5 w-5 mx-auto" />
                        </button>

                        <button
                            onClick={handleFoldersClick}
                            className="w-full rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                            title="Folders"
                        >
                            <FolderIcon className="h-5 w-5 mx-auto" />
                        </button>
                    </div>

                    <div className="mt-auto flex flex-col items-center gap-1.5 pb-4 px-2">
                        <SettingsPopover>
                            <button
                                className="w-full rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                                title="Settings"
                            >
                                <Settings className="h-5 w-5 mx-auto" />
                            </button>
                        </SettingsPopover>
                    </div>
                </motion.aside>

                <SearchModal
                    isOpen={showSearchModal}
                    onClose={() => setShowSearchModal(false)}
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    togglePin={togglePin}
                    createNewChat={createNewChat}
                />
            </>
        )
    }

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {shouldRenderSidebar && (
                    <motion.aside
                        key="sidebar"
                        initial={isMobile ? { x: -340 } : { x: 0 }}
                        animate={{ x: 0 }}
                        exit={isMobile ? { x: -340 } : { x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cls(
                            "z-50 flex h-full w-80 shrink-0 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-premium dark:shadow-none",
                            "fixed inset-y-0 left-0 md:static md:translate-x-0",
                        )}
                    >
                        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-md glow-subtle">
                                    <Asterisk className="h-4 w-4" />
                                </div>
                                <div className="text-sm font-semibold tracking-tight text-gradient">AI Assistant</div>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                <button
                                    onClick={() => setSidebarCollapsed?.(true)}
                                    className="hidden md:block rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                                    aria-label="Close sidebar"
                                    title="Close sidebar"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={onClose}
                                    className="md:hidden rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                                    aria-label="Close sidebar"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-4 pt-4">
                            <label htmlFor="search" className="sr-only">
                                Search conversations
                            </label>
                            <div className="relative group">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <input
                                    id="search"
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search conversations…"
                                    onClick={() => setShowSearchModal(true)}
                                    onFocus={() => setShowSearchModal(true)}
                                    className="w-full rounded-xl border border-border/60 bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 focus:bg-background transition-premium"
                                />
                            </div>
                        </div>

                        <div className="px-4 pt-3">
                            <button
                                onClick={createNewChat}
                                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
                                title="New Chat (⌘N)"
                            >
                                <Plus className="h-4 w-4" /> Start New Chat
                            </button>
                        </div>

                        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4 scrollbar-premium">
                            <SidebarSection
                                icon={<Star className="h-4 w-4" />}
                                title="PINNED CHATS"
                                collapsed={collapsed.pinned}
                                onToggle={() => setCollapsed((s: any) => ({ ...s, pinned: !s.pinned }))}
                            >
                                {pinned.length === 0 ? (
                                    <div className="select-none rounded-xl border border-dashed border-border/60 bg-accent/30 px-4 py-4 text-center text-xs text-muted-foreground">
                                        <Star className="h-4 w-4 mx-auto mb-1.5 text-primary/50" />
                                        Pin important threads for quick access
                                    </div>
                                ) : (
                                    pinned.map((c) => (
                                        <ConversationRow
                                            key={c.id}
                                            data={c}
                                            active={c.id === selectedId}
                                            onSelect={() => onSelect(c.id)}
                                            onTogglePin={() => togglePin(c.id)}
                                            onDelete={() => { }}
                                            onRename={() => { }}
                                            showMeta={false}
                                        />
                                    ))
                                )}
                            </SidebarSection>

                            <SidebarSection
                                icon={<Clock className="h-4 w-4" />}
                                title="RECENT"
                                collapsed={collapsed.recent}
                                onToggle={() => setCollapsed((s: any) => ({ ...s, recent: !s.recent }))}
                            >
                                {recent.length === 0 ? (
                                    <div className="select-none rounded-xl border border-dashed border-border/60 bg-accent/30 px-4 py-4 text-center text-xs text-muted-foreground">
                                        <Clock className="h-4 w-4 mx-auto mb-1.5 text-primary/50" />
                                        No conversations yet. Start a new one!
                                    </div>
                                ) : (
                                    recent.map((c) => (
                                        <ConversationRow
                                            key={c.id}
                                            data={c}
                                            active={c.id === selectedId}
                                            onSelect={() => onSelect(c.id)}
                                            onTogglePin={() => togglePin(c.id)}
                                            onDelete={() => { }}
                                            onRename={() => { }}
                                            showMeta
                                        />
                                    ))
                                )}
                            </SidebarSection>

                            <SidebarSection
                                icon={<FolderIcon className="h-4 w-4" />}
                                title="FOLDERS"
                                collapsed={collapsed.folders}
                                onToggle={() => setCollapsed((s: any) => ({ ...s, folders: !s.folders }))}
                            >
                                <div className="-mx-1">
                                    <button
                                        onClick={() => setShowCreateFolderModal(true)}
                                        className="mb-2 inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-premium"
                                    >
                                        <Plus className="h-4 w-4" /> Create folder
                                    </button>

                                    {folders.map((f) => (
                                        <FolderRow
                                            key={f.id}
                                            name={f.name}
                                            count={folderCounts[f.name] || 0}
                                            conversations={getConversationsByFolder(f.name)}
                                            selectedId={selectedId}
                                            onSelect={onSelect}
                                            togglePin={togglePin}
                                            onDeleteFolder={handleDeleteFolder}
                                            onRenameFolder={handleRenameFolder}
                                        />
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection
                                icon={<FileText className="h-4 w-4" />}
                                title="TEMPLATES"
                                collapsed={collapsed.templates}
                                onToggle={() => setCollapsed((s: any) => ({ ...s, templates: !s.templates }))}
                            >
                                <div className="-mx-1">
                                    <button
                                        onClick={() => setShowCreateTemplateModal(true)}
                                        className="mb-2 inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-premium"
                                    >
                                        <Plus className="h-4 w-4" /> Create template
                                    </button>

                                    {(Array.isArray(templates) ? templates : []).map((template) => (
                                        <TemplateRow
                                            key={template.id}
                                            template={template}
                                            onUseTemplate={handleUseTemplate}
                                            onEditTemplate={handleEditTemplate}
                                            onRenameTemplate={handleRenameTemplate}
                                            onDeleteTemplate={handleDeleteTemplate}
                                        />
                                    ))}

                                    {(!templates || templates.length === 0) && (
                                        <div className="select-none rounded-xl border border-dashed border-border/60 bg-accent/30 px-4 py-4 text-center text-xs text-muted-foreground">
                                            <FileText className="h-4 w-4 mx-auto mb-1.5 text-primary/50" />
                                            Create your first prompt template
                                        </div>
                                    )}
                                </div>
                            </SidebarSection>
                        </nav>

                        <div className="mt-auto border-t border-border/50 px-4 py-4">
                            <div className="flex items-center gap-2">
                                <SettingsPopover>
                                    <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium">
                                        <Settings className="h-4 w-4" /> Settings
                                    </button>
                                </SettingsPopover>
                                <div className="ml-auto">
                                    <ThemeToggle theme={theme} setTheme={setTheme} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent/60 p-3 border border-border/40 hover:bg-accent/80 transition-premium cursor-pointer">
                                <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-xs font-bold text-white shadow-sm">
                                    JD
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold">John Doe</div>
                                    <div className="truncate text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Pro workspace
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreateFolder={handleCreateFolder}
            />

            <CreateTemplateModal
                isOpen={showCreateTemplateModal}
                onClose={() => {
                    setShowCreateTemplateModal(false)
                    setEditingTemplate(null)
                }}
                onCreateTemplate={handleCreateTemplate}
                editingTemplate={editingTemplate}
            />

            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={onSelect}
                togglePin={togglePin}
                createNewChat={createNewChat}
            />
        </>
    )
}
