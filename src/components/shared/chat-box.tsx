"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type Props = {
  otherUserId: string;
  currentUserId: string;
  title?: string;
  subtitle?: string;
};

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChatBox({ otherUserId, currentUserId, title = "Чат", subtitle = "Хабарлама жіберіп, жауапты күтіңіз" }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${otherUserId}`, { cache: "no-store" });
    const data = (await res.json()) as { messages?: ChatMessage[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Хабарламаларды жүктеу қатесі");
      return;
    }
    setMessages(data.messages ?? []);
  }, [otherUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/messages/${otherUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Жіберу қатесі");
      setLoading(false);
      return;
    }

    setText("");
    setLoading(false);
    await loadMessages();
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-sm">
            {getInitials(title)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.22),_transparent_34%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_100%)] px-4 py-4">
        <div className="flex h-[62vh] flex-col rounded-[24px] border border-slate-200 bg-white/70 shadow-inner backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-white/60 px-6 text-center">
                <div>
                  <p className="text-base font-semibold text-slate-900">Әзірге хабарлама жоқ</p>
                  <p className="mt-1 text-sm text-slate-500">Алғашқы хабарды төмендегі өрістен жіберіңіз.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const own = msg.senderId === currentUserId;
                  const time = new Date(msg.createdAt).toLocaleTimeString("kk-KZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
                      {!own && (
                        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {getInitials(title)}
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          own
                            ? "rounded-br-md bg-[#d7f3ff] text-slate-900"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-6">{msg.content}</p>
                        <p className={`mt-1 text-[11px] ${own ? "text-slate-500" : "text-slate-400"}`}>{time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="border-t border-slate-200 px-4 py-2 text-sm font-medium text-red-600">{error}</p>}

          <div className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="flex items-end gap-2 rounded-[22px] border border-slate-300 bg-slate-50 px-3 py-2 shadow-inner focus-within:border-cyan-400 focus-within:bg-white">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400"
                placeholder="Хабарлама жазыңыз..."
                disabled={loading}
                rows={1}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Жіберілуде..." : "Жіберу"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
