"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { cls, timeAgo } from "./utils"
import { TypingAnimation } from "./ui/typing-animation"
import type { ChatPaneHandle, ChatPaneProps, ComposerHandle, ThinkingMessageProps } from "@/lib/types/ui"
import type { Message as MessageType } from "@/lib/types/chat"



function ThinkingMessage({ onPause }: ThinkingMessageProps) {
    return (
        <Message role="assistant">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60"></div>
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
                <button
                    onClick={onPause}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-premium"
                >
                    <Square className="h-3 w-3" /> Pause
                </button>
            </div>
        </Message>
    )
}



const ChatPane = forwardRef<ChatPaneHandle, ChatPaneProps>(function ChatPane(
    { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, streamingMessageId },
    ref,
) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState("")
    const [busy, setBusy] = useState(false)
    const composerRef = useRef<ComposerHandle>(null)

    useImperativeHandle(
        ref,
        () => ({
            insertTemplate: (templateContent: string) => {
                composerRef.current?.insertTemplate(templateContent)
            },
        }),
        [],
    )

    if (!conversation) return null

    const tags = ["Certified", "Personalized", "Experienced", "Helpful"]
    const messages = Array.isArray(conversation.messages) ? conversation.messages : []
    const count = messages.length || conversation.messageCount || 0

    function startEdit(m: MessageType) {
        setEditingId(m.id)
        setDraft(m.content)
    }
    function cancelEdit() {
        setEditingId(null)
        setDraft("")
    }
    function saveEdit() {
        if (!editingId) return
        onEditMessage?.(editingId, draft)
        cancelEdit()
    }
    function saveAndResend() {
        if (!editingId) return
        onEditMessage?.(editingId, draft)
        onResendMessage?.(editingId)
        cancelEdit()
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-background to-muted/30">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 scrollbar-premium">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-3">
                        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-gradient">{conversation.title}</span>
                    </div>
                    <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                            Updated {timeAgo(conversation.updatedAt)}
                        </span>
                        <span className="text-border">•</span>
                        <span>{count} messages</span>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-2 border-b border-border/50 pb-6">
                        {tags.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center rounded-full border border-border/60 bg-accent/50 px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-premium cursor-default"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white shadow-md mb-4">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Start a conversation</p>
                        <p className="text-xs text-muted-foreground">Type your message below to begin chatting with AI</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((m) => (
                            <div key={m.id} className="space-y-2">
                                {editingId === m.id ? (
                                    <div className={cls("rounded-2xl border p-3 shadow-premium", "border-border/60 bg-card")}>
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            className="w-full resize-y rounded-xl bg-background/50 p-3 text-sm outline-none border border-border/40 focus:border-primary focus:ring-2 focus:ring-ring/20 transition-premium"
                                            rows={3}
                                        />
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={saveEdit}
                                                className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:shadow-md transition-premium"
                                            >
                                                <Check className="h-3.5 w-3.5" /> Save
                                            </button>
                                            <button
                                                onClick={saveAndResend}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-medium hover:bg-accent/80 transition-premium"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-premium"
                                            >
                                                <X className="h-3.5 w-3.5" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Message role={m.role}>
                                        {m.role === "assistant" && m.id === streamingMessageId ? (
                                            <TypingAnimation
                                                text={m.content}
                                                className="text-sm leading-relaxed"
                                                duration={14}
                                                showCursor={true}
                                                blinkCursor={true}
                                                cursorStyle="line"
                                            />
                                        ) : (
                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                        )}
                                        {m.role === "user" && (
                                            <div className="mt-2 flex gap-3 text-[11px] text-white/70">
                                                <button className="inline-flex items-center gap-1 hover:text-white transition-colors" onClick={() => startEdit(m)}>
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                                <button
                                                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                                                    onClick={() => onResendMessage?.(m.id)}
                                                >
                                                    <RefreshCw className="h-3 w-3" /> Resend
                                                </button>
                                            </div>
                                        )}
                                    </Message>
                                )}
                            </div>
                        ))}
                        {isThinking && onPauseThinking && <ThinkingMessage onPause={onPauseThinking} />}
                    </div>
                )}
            </div>

            <Composer
                ref={composerRef}
                onSend={async (text) => {
                    if (!text.trim()) return
                    setBusy(true)
                    await onSend?.(text)
                    setBusy(false)
                }}
                busy={busy}
            />
        </div>
    )
})

export default ChatPane
