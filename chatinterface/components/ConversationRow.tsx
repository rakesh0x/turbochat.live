"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Pin, Edit3, Trash2 } from "lucide-react"
import { cls, timeAgo } from "./utils"
import { motion, AnimatePresence } from "motion/react"
import type { ConversationRowProps } from "@/lib/types/ui"


export default function ConversationRow({
    data,
    active,
    onSelect,
    onTogglePin,
    onDelete,
    onRename,
    showMeta
}: ConversationRowProps) {
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const count = Array.isArray(data.messages) ? data.messages.length : (data.messageCount || 0)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showMenu])

    const handlePin = (e: React.MouseEvent) => {
        e.stopPropagation()
        onTogglePin?.()
        setShowMenu(false)
    }

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation()
        const newName = prompt(`Rename chat "${data.title}" to:`, data.title)
        if (newName && newName.trim() && newName !== data.title) {
            onRename?.(data.id, newName.trim())
        }
        setShowMenu(false)
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm(`Are you sure you want to delete "${data.title}"?`)) {
            onDelete?.(data.id)
        }
        setShowMenu(false)
    }

    return (
        <div className="group relative">
            <button
                onClick={onSelect}
                className={cls(
                    "-mx-1 flex w-[calc(100%+8px)] items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-premium",
                    active
                        ? "bg-accent/80 text-foreground shadow-sm border border-border/40"
                        : "hover:bg-accent/50 border border-transparent",
                )}
                title={data.title}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {data.pinned && <Pin className="h-3 w-3 shrink-0 text-primary/70" />}
                        <span className="truncate text-sm font-medium tracking-tight">{data.title}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(data.updatedAt)}</span>
                    </div>
                    {showMeta && <div className="mt-0.5 text-[10px] text-muted-foreground">{count} messages</div>}
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-background hover:text-foreground"
                        aria-label="Chat options"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl py-1.5 shadow-premium-lg z-[100]"
                            >
                                <button
                                    onClick={handlePin}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-accent/80 flex items-center gap-2.5 transition-colors"
                                >
                                    {data.pinned ? (
                                        <>
                                            <Pin className="h-3.5 w-3.5 text-primary" />
                                            Unpin
                                        </>
                                    ) : (
                                        <>
                                            <Pin className="h-3.5 w-3.5" />
                                            Pin
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleRename}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-accent/80 flex items-center gap-2.5 transition-colors"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Rename
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </button>

            <div className="pointer-events-none absolute left-[calc(100%+8px)] top-0 hidden w-64 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 text-xs text-foreground shadow-premium-lg md:group-hover:block z-[100]">
                <div className="line-clamp-6 whitespace-pre-wrap leading-relaxed">{data.preview}</div>
            </div>
        </div>
    )
}
