"use client"

import { useState, useRef, useEffect } from "react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BotIcon, RefreshCwIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Input } from "@/components/ui/input";
import { TypingAnimation } from "@/components/ui/typing-animation";
import type { PlaygroundPageProps } from "@/lib/types/ui";


export function PlaygroundPage({ chatbot }: PlaygroundPageProps) {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; timestamp: string; streaming?: boolean }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session-${Date.now()}`);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (chatbot) {
      loadConversation();
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!chatbot) return;
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/conversation?sessionId=${sessionId.current}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !chatbot || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsTyping(true);

    // Add streaming assistant bubble
    const asstId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: asstId, role: 'assistant', content: '', timestamp: new Date().toISOString(), streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, conversation_id: sessionId.current }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('Stream request failed');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let parsed: any;
          try { parsed = JSON.parse(line.slice(6)); } catch { continue; }
          if (parsed.token) {
            setMessages((prev) =>
              prev.map((m) => m.id === asstId ? { ...m, content: m.content + parsed.token } : m)
            );
          }
          if (parsed.done || parsed.error) {
            setMessages((prev) => prev.map((m) => m.id === asstId ? { ...m, streaming: false } : m));
            setIsTyping(false);
            return;
          }
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Stream error:', error);
      toast.error('Failed to connect to AI. Make sure the backend server is running.');
      setMessages((prev) =>
        prev.map((m) => m.id === asstId ? { ...m, content: m.content || 'Error getting response.', streaming: false } : m)
      );
    } finally {
      setIsTyping(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  };

  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto border-slate-200/80 dark:border-slate-800">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to test</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chatbot Info */}
      <Card className="h-fit border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md shadow-slate-300/60 dark:from-slate-100 dark:to-slate-300 dark:shadow-none">
              <BotIcon className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <CardTitle className="text-base">{chatbot.name}</CardTitle>
              <CardDescription className="text-xs">{chatbot.website}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{chatbot.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {chatbot.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-medium">{chatbot.pagesScraped}</span>
            </div>
          </div>
          <Separator />
          <Button
            variant="outline"
            className="w-full rounded-xl"
            size="sm"
            onClick={() => { setMessages([]); sessionId.current = `session-${Date.now()}`; }}
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-3 flex h-[640px] flex-col border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none min-w-0 overflow-hidden">
        <CardHeader className="border-b border-slate-200/70 dark:border-slate-800 flex-none">
          <CardTitle>Chat Playground</CardTitle>
          <CardDescription>Test your chatbot with real conversations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4 min-w-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <MessageSquareIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Start a conversation</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full min-w-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] overflow-x-hidden rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words overflow-hidden min-w-0 ${msg.role === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      }`}>
                      <div className="whitespace-pre-wrap overflow-x-auto break-words leading-relaxed">
                        {msg.content}
                      </div>
                      {msg.streaming && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-slate-400 align-middle" />
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start w-full">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isTyping}
              />
              {isTyping ? (
                <Button onClick={stopStream} size="icon" variant="outline">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!input.trim()} size="icon">
                  <SendIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}