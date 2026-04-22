"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FilePreviewButton } from "@/components/patient/file-preview-button";

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  isEncrypted: boolean;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Файл өлшемі 10MB-дан аспауы керек");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function send() {
    if (!text.trim() && !selectedFile) {
      return;
    }

    setLoading(true);
    setError(null);

    let bodyContent: FormData | string;
    let headers: HeadersInit = {};

    if (selectedFile) {
      const formData = new FormData();
      formData.append("content", text);
      formData.append("file", selectedFile);
      bodyContent = formData;
    } else {
      headers = { "Content-Type": "application/json" };
      bodyContent = JSON.stringify({ content: text });
    }

    const res = await fetch(`/api/messages/${otherUserId}`, {
      method: "POST",
      headers,
      body: bodyContent,
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Жіберу қатесі");
      setLoading(false);
      return;
    }

    setText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                ШИФРЛАНҒАН
              </div>
            </div>
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
                        {msg.fileUrl && (
                          <div className="mb-3 space-y-2">
                            {msg.fileType?.startsWith("image/") ? (
                              <div className="relative aspect-auto max-h-60 overflow-hidden rounded-xl border border-slate-200/50">
                                <img src={msg.fileUrl} alt={msg.fileName || ""} className="max-h-full max-w-full object-contain" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-white/50 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
                                  📎
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-slate-900">{msg.fileName}</p>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{msg.fileType?.split("/")[1] || "файл"}</p>
                                </div>
                              </div>
                            )}
                            <FilePreviewButton 
                              url={msg.fileUrl} 
                              name={msg.fileName || "файл"} 
                              type={msg.fileType || "application/octet-stream"} 
                              label="Көру / Жүктеу"
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/60 py-2 text-xs font-bold text-slate-700 hover:bg-white transition ring-1 ring-slate-200/50"
                            />
                          </div>
                        )}
                        {msg.content && <p className="whitespace-pre-wrap leading-6">{msg.content}</p>}
                        <div className="mt-1 flex items-center justify-between gap-2">
                           <p className={`text-[11px] ${own ? "text-slate-500" : "text-slate-400"}`}>{time}</p>
                           {msg.isEncrypted && (
                             <svg className={`h-3 w-3 ${own ? "text-cyan-600" : "text-slate-400"}`} fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                             </svg>
                           )}
                        </div>
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
            {selectedFile && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-cyan-50 px-4 py-2 ring-1 ring-cyan-100">
                <div className="flex items-center gap-3">
                   <span className="text-xl">📎</span>
                   <div className="min-w-0">
                     <p className="truncate text-sm font-bold text-cyan-900">{selectedFile.name}</p>
                     <p className="text-[10px] text-cyan-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                   </div>
                </div>
                <button onClick={removeFile} className="rounded-full p-1 text-cyan-400 hover:bg-cyan-100 hover:text-cyan-600 transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-[22px] border border-slate-300 bg-slate-50 px-3 py-2 shadow-inner focus-within:border-cyan-400 focus-within:bg-white transition-all duration-200">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition flex-shrink-0"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
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
                disabled={loading || (!text.trim() && !selectedFile)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "..." : "Жіберу"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
