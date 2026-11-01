"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Globe,
  MessageSquare,
  Mic,
  Bot,
  User,
  Volume2,
  CheckCheck,
} from "lucide-react";
import { BotConfig, Channel } from "@personaforge/core";

interface PreviewTabProps {
  config: BotConfig;
  channel: Channel;
  onChangeChannel: (ch: Channel) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function PreviewTab({
  config,
  channel,
  onChangeChannel,
}: PreviewTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        config.ui?.greeting ||
        "Hello! I am your AI assistant configured in PersonaForge. How may I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
      const res = await fetch("/api/preview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          channel,
        }),
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Error: ${errJson.error || "Failed to generate response"}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = "";
      let accumulatedReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n\n");
        streamBuffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          // Parse event and data
          const eventMatch = /^event:\s*(.+)$/m.exec(trimmed);
          const dataMatch = /^data:\s*(.+)$/m.exec(trimmed);

          const eventType = eventMatch ? eventMatch[1]?.trim() : "message";
          const dataStr = dataMatch ? dataMatch[1]?.trim() : "";

          if (eventType === "token" && dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedReply += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m
                  )
                );
              }
            } catch {
              // Ignore partial JSON
            }
          } else if (eventType === "error" && dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              accumulatedReply = `Error: ${parsed.message}`;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m
                )
              );
            } catch {
              // Ignore
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Modern Web Best Practice: IME composition safe Enter submit
    if (e.key === "Enter" && !e.shiftKey) {
      if (isComposing || (e.nativeEvent as any).isComposing || e.keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content:
          config.ui?.greeting ||
          "Hello! I am your AI assistant configured in PersonaForge. How may I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70">
      {/* Top Bar with Channel Switcher & Reset */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/40">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeChannel("web")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              channel === "web"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Web
          </button>
          <button
            onClick={() => onChangeChannel("whatsapp")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              channel === "whatsapp"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => onChangeChannel("voice")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              channel === "voice"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice
          </button>
        </div>

        <button
          onClick={resetChat}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* WhatsApp simulated frame header */}
      {channel === "whatsapp" && (
        <div className="bg-[#075e54] text-white px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
              {config.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">{config.name}</div>
              <div className="text-[10px] text-emerald-200">WhatsApp Sandbox (Online)</div>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100 font-mono">
            /use {config.slug.slice(0, 6)}
          </span>
        </div>
      )}

      {/* Voice mode simulated banner */}
      {channel === "voice" && (
        <div className="bg-violet-950/40 border-b border-violet-800/30 text-violet-200 px-4 py-2 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            Sarvam BulBul v3 Voice Synthesizer active
          </span>
          <span className="text-[10px] text-violet-400 font-mono">Sentence Chunking</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${
          channel === "whatsapp" ? "bg-[#0b141a]/60" : ""
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && channel !== "whatsapp" && (
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  channel === "whatsapp"
                    ? isUser
                      ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                      : "bg-[#202c33] text-[#d1d7db] rounded-tl-none"
                    : isUser
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "glass-panel text-slate-200 rounded-bl-none border-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content || (isStreaming ? "Thinking..." : "")}</div>
                <div
                  className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                    channel === "whatsapp"
                      ? "text-slate-400"
                      : isUser
                      ? "text-indigo-200"
                      : "text-slate-500"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && channel === "whatsapp" && (
                    <CheckCheck className="w-3 h-3 text-cyan-400" />
                  )}
                </div>
              </div>

              {isUser && channel !== "whatsapp" && (
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-end gap-2 bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500 rounded-xl p-2 transition">
          <textarea
            rows={1}
            value={input}
            placeholder={
              channel === "voice"
                ? "Type a query or speak to bot..."
                : channel === "whatsapp"
                ? "Type a WhatsApp message..."
                : "Send a message..."
            }
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none max-h-24 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-[10px] text-slate-500 text-center mt-1.5">
          Enter to send &bull; Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
