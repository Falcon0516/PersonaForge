"use client";

import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  Code,
  Download,
  MessageSquare,
  Globe,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { BotConfig } from "@personaforge/core";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onExportHtml?: (mode: "hosted" | "byok") => void;
}

export function PublishModal({
  isOpen,
  onClose,
  config,
  onExportHtml,
}: PublishModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "embed" | "html" | "whatsapp">("link");

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const hostedUrl = `${origin}/b/${config.slug}`;
  const embedCode = `<script src="${origin}/embed.js?bot=${config.slug}" async></script>`;

  const copyToClipboard = (text: string, type: "link" | "embed") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border-indigo-500/30 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Publish & Export Persona</h3>
              <p className="text-xs text-slate-400">
                Instantly deploy to web, embed in any website, or download as standalone HTML
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel / Format Tabs */}
        <div className="flex border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === "link"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Hosted Page
          </button>
          <button
            onClick={() => setActiveTab("embed")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === "embed"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Embed Widget
          </button>
          <button
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === "html"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Standalone HTML
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === "whatsapp"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Sandbox
          </button>
        </div>

        {/* Tab 1: Hosted Page */}
        {activeTab === "link" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Public Bot URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={hostedUrl}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(hostedUrl, "link")}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={hostedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                  title="Open Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Hosted page includes the customizable chat bubble, theme styles, and token quota protection. Server credentials and compiled prompts are strictly private.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Embed Widget */}
        {activeTab === "embed" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Embed Script Tag
              </label>
              <div className="flex items-center gap-2">
                <textarea
                  readOnly
                  rows={2}
                  value={embedCode}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none select-all resize-none"
                />
                <button
                  onClick={() => copyToClipboard(embedCode, "embed")}
                  className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Copy Embed Snippet"
                >
                  {copiedEmbed ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Paste this script before the closing <code>&lt;/body&gt;</code> tag of any web application (WordPress, Webflow, Shopify, React, Next.js).
            </p>
          </div>
        )}

        {/* Tab 3: Standalone HTML Export */}
        {activeTab === "html" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Export a single, fully self-contained <code>.html</code> file with zero build step requirements:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hosted Mode */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Globe className="w-4 h-4 text-indigo-400" /> Hosted Mode
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Streams from PersonaForge API. Never leaks prompt or server API keys.
                </p>
                <button
                  onClick={() => onExportHtml && onExportHtml("hosted")}
                  className="w-full py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Hosted HTML
                </button>
              </div>

              {/* BYOK Mode */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <KeyRound className="w-4 h-4 text-cyan-400" /> BYOK (Zero Server)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Embeds compiled prompt directly. Asks user for their own Groq key stored locally.
                </p>
                <button
                  onClick={() => onExportHtml && onExportHtml("byok")}
                  className="w-full py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download BYOK HTML
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: WhatsApp Sandbox */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Multi-Tenant WhatsApp Gateway
              </div>
              <p className="leading-relaxed">
                PersonaForge multiplexes all bots onto a single WhatsApp Twilio sandbox number.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-emerald-400 font-bold">
                /use {config.slug.slice(0, 8)}
              </div>
              <p className="text-[11px] text-slate-400">
                Send this command to switch your conversation to this bot. Type <code>/bots</code> to list all available bots, or <code>/reset</code> to clear your session.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
