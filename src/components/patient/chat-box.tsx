"use client";

import { useEffect, useState } from "react";
import { useCallback } from "react";

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

type Props = {
  otherUserId: string;
  currentUserId: string;
};

export function ChatBox({ otherUserId, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Чат</h2>

      <div className="mt-4 h-[380px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Хабарлама жоқ.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const own = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${own ? "ml-auto bg-cyan-600 text-white" : "bg-white text-slate-800"}`}>
                  <p>{msg.content}</p>
                  <p className={`mt-1 text-xs ${own ? "text-cyan-50" : "text-slate-500"}`}>{new Date(msg.createdAt).toLocaleString("kk-KZ")}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Хабарлама жазыңыз..."
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? "..." : "Жіберу"}
        </button>
      </div>
    </section>
  );
}
