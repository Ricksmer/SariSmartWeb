"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Kumusta! I am your **SariSmart AI Assistant**. You can ask me to check stock levels, update selling prices, add items, archive products, and organize units using simple everyday words.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

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

  return (
    <>
      {/* Floating Launcher Button (Firmly fixed on screen lower-right) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0a3520] via-[#145b34] to-[#1a7949] px-5 py-3.5 text-white shadow-[0_10px_35px_rgba(26,121,73,0.45)] border-2 border-emerald-300/60 ring-4 ring-emerald-500/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_45px_rgba(26,121,73,0.6)] active:scale-95 cursor-pointer font-heading"
        title="Open SariSmart AI Assistant"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          ✦
        </span>
        <span className="font-extrabold text-sm tracking-wide">AI Store Assistant</span>
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse-glow" />
      </button>

      {/* Slide-Over Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl z-10 border-l border-emerald-900/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/10 bg-gradient-to-r from-[#0c361e] via-[#145a37] to-[#1a7949] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-emerald-200 text-base font-bold shadow-xs">
                  ✦
                </div>
                <div>
                  <h3 className="font-black text-white text-base font-heading flex items-center gap-2">
                    SariSmart Assistant
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full">
                      Store AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Manage stocks, prices &amp; items with simple words</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sari-grid">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      m.sender === "user"
                        ? "bg-[#1a7949] text-white font-medium rounded-br-xs"
                        : "bg-white text-stone-800 border border-emerald-100 rounded-bl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {/* Render Action Items if present */}
                    {m.items && m.items.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1.5">
                        {m.items.slice(0, 4).map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between rounded-lg bg-emerald-50/70 px-2.5 py-1 text-[11px] text-[#145a37] font-semibold border border-emerald-200/60"
                          >
                            <span className="truncate max-w-[150px]">
                              {it.brand ? `[${it.brand}] ` : ""}{it.name}
                            </span>
                            <span className="font-mono font-bold">
                              ₱{it.selling_price?.toFixed(2) ?? "TBD"} &bull; {it.quantity} in stock
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
                <div className="flex items-center gap-2 text-xs font-bold text-[#1a7949] bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl w-fit shadow-2xs animate-pulse-glow">
                  <span className="flex h-2 w-2 rounded-full bg-[#1a7949] animate-ping" />
                  <span>Updating store catalog...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="border-t border-stone-100 bg-stone-50/80 px-4 py-2.5 overflow-x-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Quick Actions</p>
              <div className="flex gap-1.5 pb-1">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="whitespace-nowrap rounded-xl bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 border border-stone-200/80 hover:border-emerald-300 hover:text-[#1a7949] hover:bg-emerald-50/50 transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-emerald-900/10 p-3 bg-white">
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
                  placeholder="e.g. Update price of Coke Mismo to 20..."
                  className="input text-xs sm:text-sm font-medium flex-1"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn btn-primary px-4 py-2.5 text-xs font-bold shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Send →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
