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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4 sm:p-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Grounded Article RAG
            </span>
            <h2 className="text-lg font-bold text-[var(--foreground)] truncate max-w-xs">
              Ask AI: {note.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-xs text-[var(--muted)]">
              <p className="font-semibold text-sm text-[var(--foreground)] mb-1">
                Ask anything about this note
              </p>
              Answers are grounded strictly in the context of <br />
              <span className="italic">"{note.title}"</span>.
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                    : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)] animate-pulse">
                Thinking & grounding answer...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-[var(--border)] p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this article..."
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--background)] hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
