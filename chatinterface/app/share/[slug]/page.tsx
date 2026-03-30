"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PublicChatbot = {
  id: string;
  name: string;
  status: string;
  shareSlug: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export default function ShareChatbotPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [chatbot, setChatbot] = useState<PublicChatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  // Abort controller so the user can stop a stream mid-way
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/public/chatbots/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || data?.message || "Shared chatbot not found");
        setChatbot(data);
      } catch (e: any) {
        setError(e?.message || "Unable to load chatbot");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopStream = () => {
    abortRef.current?.abort();
    // Finalise the streaming bubble
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
    setSending(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatbot || sending) return;

    const text = input.trim();
    setInput("");

    // Add user message immediately
    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: text }]);
    setSending(true);

    // Add an empty streaming assistant bubble
    const asstMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: asstMsgId, role: "assistant", content: "", streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || errData?.message || "Stream request failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream body");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed: any;
          try { parsed = JSON.parse(raw); } catch { continue; }

          if (parsed.error) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: parsed.error, streaming: false }
                  : m
              )
            );
            setSending(false);
            return;
          }

          if (parsed.token) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: m.content + parsed.token }
                  : m
              )
            );
          }

          if (parsed.done) {
            setMessages((prev) =>
              prev.map((m) => (m.id === asstMsgId ? { ...m, streaming: false } : m))
            );
            setSending(false);
            return;
          }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return; // user stopped it
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                content: m.content || (e?.message ?? "Something went wrong. Please try again."),
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setSending(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chatbot…
        </div>
      </main>
    );
  }

  if (error || !chatbot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
          <h1 className="text-xl font-semibold">Share Link Not Available</h1>
          <p className="mt-2 text-sm text-zinc-400">{error || "This chatbot is private or no longer shared."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#082f49,_#020617_40%,_#020617_100%)] px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <section className="mb-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-200">Hosted by Turbochat AI</p>
          <h1 className="mt-2 text-2xl font-semibold">{chatbot.name}</h1>
          <p className="mt-1 text-sm text-zinc-300">Ask questions and get instant answers from this assistant.</p>
        </section>

        {/* Chat window */}
        <section className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl" style={{ height: "65vh" }}>
          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-400">Start by asking your first question.</p>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {/* Blinking cursor while streaming */}
                  {message.streaming && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle" />
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-zinc-800 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything…"
                disabled={sending}
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400 disabled:opacity-60"
              />

              {sending ? (
                /* Stop button while streaming */
                <button
                  type="button"
                  onClick={stopStream}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-zinc-200 transition hover:bg-zinc-600"
                  aria-label="Stop"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
