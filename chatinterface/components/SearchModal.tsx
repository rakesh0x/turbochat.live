"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, SearchIcon, Plus, Clock } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

interface Conversation {
    id: string;
    title: string;
    preview: string;
    updatedAt: string | Date;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    selectedId?: string;
    onSelect: (id: string) => void;
    togglePin?: (id: string) => void;
    createNewChat: () => void;
}

type TimeGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Older"

function getTimeGroup(dateString: string | Date): TimeGroup {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (date >= today) return "Today"
    if (date >= yesterday) return "Yesterday"
    if (date >= sevenDaysAgo) return "Previous 7 Days"
    return "Older"
}

export default function SearchModal({
    isOpen,
    onClose,
    conversations,
    selectedId,
    onSelect,
    togglePin,
    createNewChat,
}: SearchModalProps) {
    const [query, setQuery] = useState("")

    const filteredConversations = useMemo(() => {
        if (!query.trim()) return conversations
        const q = query.toLowerCase()
        return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
    }, [conversations, query])

    const groupedConversations = useMemo(() => {
        const groups: Record<TimeGroup, Conversation[]> = {
            Today: [],
            Yesterday: [],
            "Previous 7 Days": [],
            Older: [],
        }

        filteredConversations
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .forEach((conv) => {
                const group = getTimeGroup(conv.updatedAt)
                groups[group].push(conv)
            })

        return groups
    }, [filteredConversations])

    const handleClose = () => {
        setQuery("")
        onClose()
    }

    const handleNewChat = () => {
        createNewChat()
        handleClose()
    }

    const handleSelectConversation = (id: string) => {
        onSelect(id)
        handleClose()
    }

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose()
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            return () => document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed left-1/2 top-[15%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-premium-lg overflow-hidden"
                    >
                        {/* Search Header */}
                        <div className="flex items-center gap-3 border-b border-border/50 p-4 bg-muted/30">
                            <SearchIcon className="h-5 w-5 text-primary/70" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                                autoFocus
                            />
                            <button onClick={handleClose} className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-premium">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Results */}
                        <div className="max-h-[60vh] overflow-y-auto scrollbar-premium">
                            {/* New Chat Option */}
                            <div className="border-b border-border/50 p-2">
                                <button
                                    onClick={handleNewChat}
                                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-accent/80 transition-premium"
                                >
                                    <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-sm">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium">Start new chat</span>
                                </button>
                            </div>

                            {/* Conversation Groups */}
                            {(Object.entries(groupedConversations) as [TimeGroup, Conversation[]][]).map(([groupName, convs]) => {
                                if (convs.length === 0) return null

                                return (
                                    <div key={groupName} className="border-b border-border/50 p-2 last:border-b-0">
                                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{groupName}</div>
                                        <div className="space-y-1">
                                            {convs.map((conv) => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => handleSelectConversation(conv.id)}
                                                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-accent/80 transition-premium"
                                                >
                                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate font-medium">{conv.title}</div>
                                                        <div className="truncate text-sm text-muted-foreground">{conv.preview}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Empty State */}
                            {filteredConversations.length === 0 && query.trim() && (
                                <div className="p-12 text-center">
                                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                                        <SearchIcon className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <div className="text-lg font-semibold">No chats found</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        Try searching with different keywords
                                    </div>
                                </div>
                            )}

                            {/* Default State - Show all conversations when no query */}
                            {!query.trim() && conversations.length === 0 && (
                                <div className="p-12 text-center">
                                    <div className="text-lg font-semibold">No conversations yet</div>
                                    <div className="mt-1 text-sm text-muted-foreground">Start a new chat to begin</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
