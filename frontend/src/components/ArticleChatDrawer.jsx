"use client";

import { useState } from "react";

export default function ArticleChatDrawer({ isOpen, onClose, note }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: note.slug,
          title: note.title,
          question: userMsg,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.answer || "No response received." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error communicating with AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm transition-all">
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Article Assistant
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-xs">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base text-slate-300">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">
                Ask anything about this note
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                AI responses are grounded strictly in the contents of <br />
                <span className="font-semibold text-slate-200">"{note?.title}"</span>.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                msg.sender === "user" 
                  ? "bg-white text-slate-950" 
                  : "border border-white/10 bg-white/5 text-slate-300"
              }`}>
                {msg.sender === "user" ? "U" : "AI"}
              </div>

              <div
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-white/10 border border-white/10 text-white font-medium shadow-sm"
                    : "border border-white/10 bg-white/[0.03] text-slate-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[11px] font-mono">Analyzing article...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="border-t border-white/10 p-4 bg-slate-900/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this note..."
              className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none transition focus:border-white/30"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


