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
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Article Assistant
              </span>
            </div>
            <h2 className="text-sm font-bold text-[var(--foreground)] truncate max-w-xs">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-base text-[var(--foreground)]">
                <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xs font-bold text-[var(--foreground)]">
                Ask anything about this note
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs mx-auto">
                AI responses are grounded strictly in the contents of <br />
                <span className="font-semibold text-[var(--foreground)]">"{note?.title}"</span>.
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
                  ? "bg-[var(--foreground)] text-[var(--background)]" 
                  : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
              }`}>
                {msg.sender === "user" ? "U" : "AI"}
              </div>

              <div
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm"
                    : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] backdrop-blur-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <div className="flex space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px]">Analyzing article...</span>
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
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3.5 py-2 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--focus)]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


