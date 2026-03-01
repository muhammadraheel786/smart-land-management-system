"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function analyzeQuery(query: string, store: ReturnType<typeof useLandStore.getState>): string {
  const q = query.toLowerCase();
  const fields = store.fields;
  const expenses = store.expenses;
  const incomes = store.incomes;
  const thaka = store.thakaRecords;

  // Total land
  if (q.includes("total land") || q.includes("how much land") || q.includes("total area")) {
    const total = fields.reduce((a, f) => a + (f.area || 0), 0);
    return `Your total land area is approximately **${total.toFixed(2)} acres** across **${fields.length}** field(s).`;
  }

  // Cultivated
  if (q.includes("cultivated") || q.includes("farming")) {
    const cultivated = fields.filter((f) => f.status === "cultivated");
    const area = cultivated.reduce((a, f) => a + (f.area || 0), 0);
    return `You have **${cultivated.length}** cultivated field(s) totaling **${area.toFixed(2)} acres**. ${cultivated.length ? `Fields: ${cultivated.map((f) => f.name).join(", ")}` : ""
      }`;
  }

  // Profit / loss
  if (q.includes("profit") || q.includes("loss") || q.includes("income") || q.includes("expense")) {
    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const totalInc = incomes.reduce((a, i) => a + i.amount, 0);
    const profit = totalInc - totalExp;
    return `**Financial Summary:**\n- Total Expenses: Rs ${totalExp.toLocaleString()}\n- Total Income: Rs ${totalInc.toLocaleString()}\n- Net ${profit >= 0 ? "Profit" : "Loss"}: Rs ${Math.abs(profit).toLocaleString()}`;
  }

  // Thaka
  if (q.includes("thaka") || q.includes("lease") || q.includes("rented")) {
    const active = thaka.filter((t) => t.status === "active");
    const totalIncome = thaka.reduce((a, t) => a + t.amount, 0);
    return `You have **${active.length}** active Thaka (lease) agreement(s). Total Thaka income recorded: Rs ${totalIncome.toLocaleString()}. ${active.length ? `Tenants: ${active.map((t) => t.tenantName).join(", ")}` : ""
      }`;
  }

  // Field-specific
  const fieldMatch = fields.find((f) => q.includes(f.name.toLowerCase()));
  if (fieldMatch) {
    const fExp = expenses.filter((e) => e.fieldId === fieldMatch.id).reduce((a, e) => a + e.amount, 0);
    const fInc = incomes.filter((i) => i.fieldId === fieldMatch.id).reduce((a, i) => a + i.amount, 0);
    return `**${fieldMatch.name}**: Status: ${fieldMatch.status}, Area: ~${(fieldMatch.area || 0).toFixed(2)} acres. Expenses: Rs ${fExp.toLocaleString()}, Income: Rs ${fInc.toLocaleString()}, Net: Rs ${(fInc - fExp).toLocaleString()}.`;
  }

  // Temperature
  if (q.includes("temperature") || q.includes("temp")) {
    const tempRecords = store.temperatureRecords;
    const avg = tempRecords.length ? tempRecords.reduce((a, r) => a + r.temperatureC, 0) / tempRecords.length : 0;
    return `You have **${tempRecords.length}** temperature record(s). ${tempRecords.length ? `Average: ${avg.toFixed(1)}°C.` : "No records yet."}`;
  }

  // Water
  if (q.includes("water") || q.includes("irrigation")) {
    const waterRecords = store.waterRecords;
    const recent = waterRecords.slice(-5);
    return `You have **${waterRecords.length}** water/irrigation record(s). ${recent.length
      ? `Recent: ${recent.map((r) => `${r.durationMinutes} min on ${format(new Date(r.date), "MMM d")}`).join("; ")}`
      : "No records yet."
      }`;
  }

  // Unused land
  if (q.includes("unused") || q.includes("available") || q.includes("vacant")) {
    const unused = fields.filter((f) => f.status === "available" || f.status === "uncultivated");
    return `You have **${unused.length}** unused/available field(s): ${unused.map((f) => f.name).join(", ") || "None"}. Consider leasing on Thaka or cultivating.`;
  }

  // Default
  return `I've analyzed your land data. Here's what I found:\n\n- **${fields.length}** total fields\n- **${expenses.length}** expense records\n- **${incomes.length}** income records\n- **${thaka.length}** Thaka agreements\n- **${store.waterRecords.length}** water records\n- **${store.temperatureRecords?.length || 0}** temperature records\n\nAsk me: "Total land?", "Profit?", "Thaka income?", "Cultivated area?", "Water records?", "Temperature?"`;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const store = useLandStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-ai-chatbot", open);
    return () => window.removeEventListener("open-ai-chatbot", open);
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    let reply: string;
    try {
      const { reply: aiReply } = await api.getAIChat(userMsg.content);
      reply = aiReply;
    } catch {
      reply = analyzeQuery(userMsg.content, store);
    } finally {
      setLoading(false);
    }

    const botMsg: Message = {
      id: `b-${Date.now()}`,
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, botMsg]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20 flex items-center justify-center hover:scale-105 hover:shadow-green-500/30 transition-all z-[400]"
        aria-label="Open AI Chatbot"
      >
        <Bot className="w-7 h-7" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-md h-[500px] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-theme flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-green-400" />
                <span className="font-semibold">AI Land Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-theme-muted hover:text-theme"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-sm text-theme-muted">
                  Ask me anything about your land. I can analyze your areas, profits, and irrigation schedules.
                </p>
              )}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="rounded-xl px-4 py-2 bg-theme-track text-theme-muted flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking…</span>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 ${m.role === "user"
                      ? "bg-green-500/20 text-green-100"
                      : "bg-theme-track text-theme"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{m.content.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                    <p className="text-xs opacity-60 mt-1">{format(m.timestamp, "HH:mm")}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="p-4 border-t border-theme flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your land..."
                className="flex-1 px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme placeholder-theme focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={send}
                className="px-4 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
