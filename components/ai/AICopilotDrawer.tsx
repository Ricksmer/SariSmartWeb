"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  actionTaken?: string;
  items?: Array<{
    id: string;
    name: string;
    brand?: string | null;
    unit?: string | null;
    selling_price?: number | null;
    quantity: number;
  }>;
};

const SUGGESTIONS = [
  "How many bear brand are remaining?",
  "Tell me items with low stock",
  "Update price of Coke Mismo to 20",
  "Add product Marlboro Red price 120 stock 10 unit pack",
  "Extract sizes from product names",
  "Show me all Canned Goods",
];

export default function AICopilotDrawer({ inventoryId }: { inventoryId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Kumusta! How can I help with your store today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll inside the chat popup
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, maximized]);

  // Close on Escape or click outside (only when not maximized)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!open || maximized) return;
      const target = event.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, maximized]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/inventories/${inventoryId}/ai-copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: `⚠️ ${data.error}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply || "Done!",
          actionTaken: data.actionTaken,
          items: data.items,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      // If action modified data, refresh the dashboard view
      if (["update", "create", "delete", "archive", "clean"].includes(data.actionTaken)) {
        router.refresh();
      }
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Connection error. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      {/* ── Floating / Maximized Popup Window ── */}
      {open && (
        <div
          ref={popupRef}
          className={`fixed z-50 flex flex-col bg-white transition-all duration-300 ${
            maximized
              ? "top-0 right-0 w-full md:w-1/2 h-screen shadow-[-12px_0_50px_rgba(0,0,0,0.25)] border-l border-emerald-900/20 rounded-none animate-fade-in"
              : "bottom-24 right-6 w-[385px] max-w-[calc(100vw-2rem)] h-[495px] max-h-[calc(100vh-7.5rem)] rounded-3xl shadow-[0_20px_50px_-10px_rgba(15,71,43,0.35)] border border-emerald-900/20 overflow-hidden animate-scale-up"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-emerald-900/10 bg-gradient-to-r from-[#0a351f] via-[#12532f] to-[#1a7949] text-white shrink-0 ${
              maximized ? "px-6 py-4" : "px-4 py-3.5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center rounded-xl bg-white/15 text-white shadow-2xs ${
                  maximized ? "h-10 w-10" : "h-8 w-8"
                }`}
              >
                <Logo size={maximized ? "md" : "sm"} variant="icon" />
              </div>
              <div>
                <h3
                  className={`font-black text-white font-heading flex items-center gap-2 leading-none ${
                    maximized ? "text-base" : "text-sm"
                  }`}
                >
                  <span>Store Assistant</span>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                  {maximized && (
                    <span className="text-[10px] bg-white/15 text-emerald-100 font-medium px-2 py-0.5 rounded-md hidden sm:inline">
                      Expanded View (50%)
                    </span>
                  )}
                </h3>
                <p
                  className={`text-emerald-100/90 font-medium mt-1 leading-none ${
                    maximized ? "text-xs" : "text-[10px]"
                  }`}
                >
                  Ask prices, stock levels &amp; updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Maximize / Restore Toggle Button */}
              <button
                type="button"
                onClick={() => setMaximized((prev) => !prev)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                title={maximized ? "Restore compact popup" : "Maximize panel (take up right half of screen)"}
                aria-label={maximized ? "Restore compact popup" : "Maximize panel"}
              >
                {maximized ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.2}
                      d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            className={`flex-1 overflow-y-auto bg-sari-grid ${
              maximized ? "p-6 space-y-4 text-sm sm:text-base" : "p-3.5 space-y-3 text-xs"
            }`}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`leading-relaxed shadow-2xs ${
                    maximized ? "max-w-[82%] rounded-2xl p-4" : "max-w-[88%] rounded-2xl p-3"
                  } ${
                    m.sender === "user"
                      ? "bg-[#1a7949] text-white font-medium rounded-br-xs"
                      : "bg-white text-stone-800 border border-emerald-100 rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Render Action Items if present */}
                  {m.items && m.items.length > 0 && (
                    <div
                      className={`mt-2.5 pt-2.5 border-t border-stone-100 ${
                        maximized
                          ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                          : "space-y-1"
                      }`}
                    >
                      {m.items.slice(0, maximized ? 8 : 3).map((it) => (
                        <div
                          key={it.id}
                          className={`flex items-center justify-between rounded-xl bg-emerald-50/80 px-2.5 py-1.5 text-[#145a37] font-semibold border border-emerald-200/60 ${
                            maximized ? "text-xs sm:text-sm" : "text-[11px]"
                          }`}
                        >
                          <span className="truncate max-w-[160px] sm:max-w-[200px]">
                            {it.brand ? `[${it.brand}] ` : ""}{it.name}
                          </span>
                          <span className="font-mono font-bold text-[11px] shrink-0 ml-2">
                            ₱{it.selling_price?.toFixed(2) ?? "TBD"} &bull; {it.quantity} left
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div
                className={`flex items-center gap-2 font-bold text-[#1a7949] bg-emerald-50 border border-emerald-200/80 rounded-2xl w-fit shadow-2xs animate-pulse-glow ${
                  maximized ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
                }`}
              >
                <span className="flex h-2 w-2 rounded-full bg-[#1a7949] animate-ping" />
                <span>Updating store catalog...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div
            className={`border-t border-stone-100 bg-stone-50/90 overflow-x-auto shrink-0 ${
              maximized ? "px-6 py-3" : "px-3 py-2"
            }`}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Suggestions
            </p>
            <div className="flex gap-2 pb-0.5 overflow-x-auto">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(s)}
                  className={`rounded-xl bg-white font-semibold text-stone-700 border border-stone-200/80 hover:border-emerald-300 hover:text-[#1a7949] hover:bg-emerald-50/60 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    maximized ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form at bottom */}
          <div
            className={`border-t border-emerald-900/10 bg-white shrink-0 ${
              maximized ? "p-4 px-6" : "p-2.5"
            }`}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask prices, check stock, or update..."
                className={`input font-medium flex-1 rounded-xl ${
                  maximized ? "py-2.5 px-3.5 text-sm" : "py-1.5 px-2.5 text-xs"
                }`}
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`btn btn-primary font-bold shrink-0 shadow-xs cursor-pointer disabled:opacity-50 ${
                  maximized ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
                }`}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Circular Action Button (Logo Only, No Text) ── */}
      {!(open && maximized) && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0c4024] via-[#145d35] to-[#1f8c53] text-white shadow-[0_10px_30px_rgba(26,121,73,0.5)] border-2 border-emerald-300/70 transition-all duration-300 hover:scale-110 hover:shadow-[0_14px_40px_rgba(26,121,73,0.65)] active:scale-95 cursor-pointer"
          title={open ? "Close Assistant" : "Open SariSmart AI Assistant"}
          aria-label="Toggle SariSmart AI Assistant"
        >
          {open ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="flex items-center justify-center scale-110">
              <Logo size="sm" variant="icon" />
            </div>
          )}

          {/* Live Status Pulse Dot */}
          {!open && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 border-2 border-[#0c4024]" />
            </span>
          )}
        </button>
      )}
    </>,
    document.body
  );
}
