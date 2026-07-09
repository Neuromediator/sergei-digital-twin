"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/data/config";
import Avatar from "@/components/Avatar";
import SocialLinks from "@/components/SocialLinks";
import SuggestedChips from "@/components/SuggestedChips";
import ChatMessage, { type Message } from "@/components/ChatMessage";

const STORAGE_KEY = "digital-twin-history-v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted history after mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on every change (once hydrated).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages, hydrated]);

  // Auto-scroll to the newest content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: Message = { id: newId(), role: "user", content: trimmed };
      const assistantId = newId();

      // Build the history to send (existing turns + this user message).
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");
      setStreaming(true);

      const setAssistant = (updater: (prev: string) => string) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: updater(m.content) } : m)),
        );

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) {
          let errMsg = "Something went wrong. Please try again.";
          try {
            const data = await res.json();
            if (data?.error) errMsg = data.error;
          } catch {
            // non-JSON error
          }
          setAssistant(() => errMsg);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) setAssistant((prev) => prev + chunk);
        }
      } catch {
        setAssistant((prev) => prev || "Network error — please check your connection and try again.");
      } finally {
        setStreaming(false);
        inputRef.current?.focus();
      }
    },
    [messages, streaming],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    inputRef.current?.focus();
  };

  const showChips = hydrated && messages.length === 0;

  return (
    <main className="flex min-h-screen items-stretch justify-center bg-black px-3 py-4 sm:items-center sm:p-6">
      {/* Subtle top gradient like the mockup */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-950/40 to-transparent" />

      <section className="relative flex h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950/80 shadow-2xl sm:h-[88vh]">
        {/* Header */}
        <header className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-3.5 sm:gap-3 sm:px-7 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Avatar size={44} showStatus ring />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-2xl">
                {config.name}
              </h1>
              {config.title && (
                <p className="truncate text-xs text-neutral-500 sm:text-sm">{config.title}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <SocialLinks />
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                aria-label="Clear chat"
                title="Clear chat"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-800 px-2 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="chat-scroll flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
          {/* Greeting (always shown) */}
          <ChatMessage message={{ id: "greeting", role: "assistant", content: config.greeting }} />

          {messages.map((m, i) => (
            <ChatMessage
              key={m.id}
              message={m}
              streaming={
                streaming && i === messages.length - 1 && m.role === "assistant" && m.content === ""
              }
            />
          ))}

          {showChips && (
            <div className="pt-2">
              <SuggestedChips onPick={(q) => send(q)} disabled={streaming} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="border-t border-neutral-800 px-4 py-4 sm:px-6">
          <div className="flex items-end gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-4 py-2 focus-within:border-neutral-500">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Type your message..."
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={streaming || input.trim().length === 0}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
