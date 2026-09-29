"use client";

import { useState, useEffect, useRef } from "react";

export default function ArticleChatDrawer({ isOpen, onClose, note }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        { sender: "ai", text: data.answer || "No response received from AI model." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error communicating with AI service. Please check your backend connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
    >
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Article Assistant
            </span>
            <h2 className="text-xs font-medium text-zinc-200 truncate max-w-xs">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="py-14 text-center space-y-2">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-violet-800/40 bg-violet-950/40 text-violet-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xs font-medium text-zinc-200">
                Ask about this note
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                AI answers are grounded specifically in the content and architectural trade-offs of this article.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                  msg.sender === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-400"
                }`}
              >
                {msg.sender === "user" ? "U" : "AI"}
              </div>

              <div
                className={`max-w-[82%] rounded-lg p-2.5 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-violet-950/60 border border-violet-800/50 text-zinc-100"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-300"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pl-7">
              <div className="w-3.5 h-3.5 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
              <span className="text-[11px] font-mono">Analyzing article context...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="border-t border-zinc-800 p-3 bg-zinc-900/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this guide..."
              className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
