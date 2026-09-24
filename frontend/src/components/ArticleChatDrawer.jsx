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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-all">
      <div className="flex h-full w-full max-w-md flex-col border-l border-[var(--border-strong)] bg-[var(--surface-solid)] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Grounded Article RAG
              </span>
            </div>
            <h2 className="text-base font-bold text-[var(--foreground)] truncate max-w-xs">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-xl text-cyan-400">
                💬
              </div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Ask anything about this note
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs mx-auto">
                AI responses are grounded strictly in the contents of <br />
                <span className="font-semibold text-cyan-400">"{note?.title}"</span>.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                msg.sender === "user" 
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white" 
                  : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
              }`}>
                {msg.sender === "user" ? "U" : "AI"}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium shadow-md"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] backdrop-blur-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <div className="flex space-x-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px] text-[var(--muted)]">Analyzing article content...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="border-t border-[var(--border)] p-4 bg-[var(--surface-muted)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this note..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-2.5 text-xs text-[var(--foreground)] outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

