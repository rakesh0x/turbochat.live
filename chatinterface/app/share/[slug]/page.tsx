"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

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
  const conversationId = useMemo(() => Math.random().toString(36).slice(2), []);

  useEffect(() => {
    if (!slug) return;

    const loadPublicChatbot = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/public/chatbots/${slug}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || data?.message || "Shared chatbot not found");
        }

        setChatbot(data);
      } catch (loadError: any) {
        setError(loadError?.message || "Unable to load chatbot");
      } finally {
        setLoading(false);
      }
    };

    loadPublicChatbot();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatbot || sending) return;

    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setSending(true);

    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Chat failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data?.response || "No response",
        },
      ]);
    } catch (sendError: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: sendError?.message || "I am having trouble right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading shared chatbot...
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
        <section className="mb-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-200">Hosted by Turbochat AI</p>
          <h1 className="mt-2 text-2xl font-semibold">{chatbot.name}</h1>
          <p className="mt-1 text-sm text-zinc-300">Ask questions and get responses from this shared assistant.</p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl">
          <div className="h-[60vh] space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-400">Start by asking your first question.</p>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "user" ? "bg-cyan-500 text-slate-950" : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-800 px-4 py-2 text-sm text-zinc-200">Typing...</div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-zinc-800 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
