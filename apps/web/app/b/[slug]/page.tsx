"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  RotateCcw,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ShieldCheck,
  Mic,
} from "lucide-react";
import {
  getTemplateBySlug,
  getTemplateById,
  agricultureTemplate,
  BotConfig,
} from "@personaforge/core";
import { VoiceAgentModal } from "@/components/voice/VoiceAgentModal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function HostedBotPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || "kisanmitra";

  // Resolve bot configuration
  const [config, setConfig] = useState<BotConfig>(() => {
    const template = getTemplateBySlug(slug) || getTemplateById(slug);
    if (template) return template.config;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`pf_bot_${slug}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return agricultureTemplate.config;
  });

  const ui = config.ui || {};
  const primaryColor = ui.primaryColor || "#6366f1";
  const headerTitle = ui.headerTitle || config.name;
  const headerSubtitle = ui.headerSubtitle || "Online | Powered by PersonaForge";
  const greeting = ui.greeting || "Hello! How may I assist you today?";
  const avatarEmoji = ui.avatarEmoji || "🤖";
  const suggestedChips = ui.suggestedChips || [];
  const showFeedback = ui.showFeedback !== false;
  const showCopy = ui.showCopyButton !== false;
  const showTimestamps = ui.showTimestamps !== false;
  const showPoweredBy = ui.showPoweredBy !== false;

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch(`/api/public/bots/${config.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Error: ${errJson.error || "Failed to generate reply"}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (trimmed.startsWith("event: token")) {
            const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(5).trim());
                if (parsed.text) {
                  accumulatedReply += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m
                    )
                  );
                }
              } catch {}
            }
          } else if (trimmed.startsWith("event: error")) {
            const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(5).trim());
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: `Error: ${parsed.message}` } : m
                  )
                );
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `Error: ${String(err)}` } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 md:p-6 bg-[#090d16]">
      <div className="w-full max-w-xl h-[92vh] max-h-[820px] rounded-3xl glass-panel border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xl">
              {avatarEmoji}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                {headerTitle}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
              <p className="text-[11px] text-slate-400">{headerSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow transition cursor-pointer"
              title="Speak with Sarvam AI Voice Agent (BulBul v3 & Saarika v2.5)"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>
            <button
              onClick={resetChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? "text-white rounded-br-none shadow-md"
                      : "glass-panel text-slate-200 rounded-bl-none border-slate-800"
                  }`}
                  style={{
                    backgroundColor: isUser ? primaryColor : undefined,
                  }}
                >
                  <div className="whitespace-pre-wrap">{msg.content || (isStreaming ? "Thinking..." : "")}</div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-slate-800/40 gap-3">
                    {showTimestamps && <span>{msg.timestamp}</span>}

                    <div className="flex items-center gap-2 ml-auto">
                      {showCopy && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-300"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {!isUser && showFeedback && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => ((e.currentTarget as HTMLElement).style.color = "#10b981")}
                            className="hover:text-emerald-400"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => ((e.currentTarget as HTMLElement).style.color = "#f43f5e")}
                            className="hover:text-rose-400"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xs flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips */}
        {suggestedChips.length > 0 && messages.length <= 2 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {suggestedChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(chip);
                  handleSend();
                }}
                className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 whitespace-nowrap transition"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500 rounded-xl px-3 py-1.5 transition">
            <input
              type="text"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isComposing && (e.nativeEvent as any).isComposing !== true && e.keyCode !== 229) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none py-1.5"
            />
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2 rounded-lg text-violet-400 hover:text-white hover:bg-violet-600/30 transition cursor-pointer"
              title="Speak to bot using microphone"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-lg text-white disabled:opacity-40 transition cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {showPoweredBy && (
            <div className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Powered by <a href="/" className="text-indigo-400 hover:underline">PersonaForge Studio</a>
            </div>
          )}
        </div>
      </div>

      {/* Voice Agent Live Interactive Modal */}
      <VoiceAgentModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        config={config}
      />
    </div>
  );
}
