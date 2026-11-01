"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Check,
  Palette,
  Type,
  Layout,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  BotConfig,
  UIConfig,
  agricultureTemplate,
  getTemplateById,
  getTemplateBySlug,
} from "@personaforge/core";

export default function CustomizePage() {
  const params = useParams();
  const router = useRouter();
  const botId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "draft";

  const [config, setConfig] = useState<BotConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`pf_bot_${botId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return getTemplateById(botId)?.config || getTemplateBySlug(botId)?.config || agricultureTemplate.config;
  });

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeSection, setActiveSection] = useState<"colors" | "typography" | "layout" | "content">("colors");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const ui = config.ui || {};

  const updateUI = (updates: Partial<UIConfig>) => {
    const updated: BotConfig = {
      ...config,
      ui: {
        ...config.ui,
        ...updates,
      },
    };
    setConfig(updated);
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`pf_bot_${botId}`, JSON.stringify(config));
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      router.push(`/builder/${botId}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/builder/${botId}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            Chat Widget Customizer &bull; {config.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 rounded transition ${
                previewDevice === "desktop" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
              title="Desktop preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 rounded transition ${
                previewDevice === "mobile" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
              title="Mobile preview"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </header>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Controls Sidebar (380px) */}
        <aside className="w-96 border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-5 space-y-6">
          {/* Section Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection("colors")}
              className={`py-1.5 rounded-lg font-medium transition ${
                activeSection === "colors" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveSection("typography")}
              className={`py-1.5 rounded-lg font-medium transition ${
                activeSection === "typography" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Fonts
            </button>
            <button
              onClick={() => setActiveSection("layout")}
              className={`py-1.5 rounded-lg font-medium transition ${
                activeSection === "layout" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveSection("content")}
              className={`py-1.5 rounded-lg font-medium transition ${
                activeSection === "content" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Content
            </button>
          </div>

          {/* Section 1: Colors */}
          {activeSection === "colors" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Theme Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "auto"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateUI({ theme: t })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition ${
                        ui.theme === t
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={ui.primaryColor || "#6366f1"}
                    onChange={(e) => updateUI({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={ui.primaryColor || "#6366f1"}
                    onChange={(e) => updateUI({ primaryColor: e.target.value })}
                    className="w-32 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
                {/* Color swatches */}
                <div className="flex gap-2 pt-1">
                  {["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateUI({ primaryColor: c })}
                      className="w-6 h-6 rounded-full border border-slate-700 transition transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={ui.accentColor || "#38bdf8"}
                    onChange={(e) => updateUI({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={ui.accentColor || "#38bdf8"}
                    onChange={(e) => updateUI({ accentColor: e.target.value })}
                    className="w-32 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Background Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["solid", "gradient", "pattern"] as const).map((bgType) => (
                    <button
                      key={bgType}
                      onClick={() => updateUI({ backgroundType: bgType })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition ${
                        ui.backgroundType === bgType
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {bgType}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Typography */}
          {activeSection === "typography" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Font Family</label>
                <div className="space-y-1.5">
                  {(["Inter", "Outfit", "Roboto", "Plus Jakarta Sans", "Fira Code", "System"] as const).map(
                    (font) => (
                      <button
                        key={font}
                        onClick={() => updateUI({ fontFamily: font })}
                        className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition ${
                          ui.fontFamily === font
                            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span style={{ fontFamily: font }}>{font}</span>
                        {ui.fontFamily === font && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Style & Layout */}
          {activeSection === "layout" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Bubble Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["rounded", "pill", "sharp", "compact"] as const).map((bStyle) => (
                    <button
                      key={bStyle}
                      onClick={() => updateUI({ bubbleStyle: bStyle })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition ${
                        ui.bubbleStyle === bStyle
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {bStyle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Density</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["comfortable", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateUI({ density: d })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition ${
                        ui.density === d
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Launcher Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["bottom-right", "bottom-left"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateUI({ launcherPosition: pos })}
                      className={`py-2 rounded-lg text-xs font-medium border capitalize transition ${
                        ui.launcherPosition === pos
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {pos.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Timestamps</span>
                  <input
                    type="checkbox"
                    checked={ui.showTimestamps !== false}
                    onChange={(e) => updateUI({ showTimestamps: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Feedback Buttons (👍/👎)</span>
                  <input
                    type="checkbox"
                    checked={ui.showFeedback !== false}
                    onChange={(e) => updateUI({ showFeedback: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Copy Button</span>
                  <input
                    type="checkbox"
                    checked={ui.showCopyButton !== false}
                    onChange={(e) => updateUI({ showCopyButton: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Powered By Badge</span>
                  <input
                    type="checkbox"
                    checked={ui.showPoweredBy !== false}
                    onChange={(e) => updateUI({ showPoweredBy: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Content */}
          {activeSection === "content" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Header Title</label>
                <input
                  type="text"
                  value={ui.headerTitle || config.name}
                  onChange={(e) => updateUI({ headerTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Header Subtitle</label>
                <input
                  type="text"
                  value={ui.headerSubtitle || ""}
                  onChange={(e) => updateUI({ headerSubtitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Avatar Emoji</label>
                <input
                  type="text"
                  value={ui.avatarEmoji || "🤖"}
                  onChange={(e) => updateUI({ avatarEmoji: e.target.value })}
                  className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-base text-center text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Greeting Message</label>
                <textarea
                  rows={3}
                  value={ui.greeting || ""}
                  onChange={(e) => updateUI({ greeting: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </aside>

        {/* Right: Live Interactive Device Preview Frame */}
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-950/80 overflow-y-auto">
          <div
            className={`transition-all duration-300 flex flex-col rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl ${
              previewDevice === "mobile"
                ? "w-[360px] h-[640px] border-4 border-slate-800"
                : "w-[440px] h-[680px]"
            }`}
            style={{
              fontFamily: ui.fontFamily || "Inter",
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between border-b border-slate-800/80"
              style={{
                backgroundColor: ui.primaryColor || "#6366f1",
              }}
            >
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">
                  {ui.avatarEmoji || "🤖"}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {ui.headerTitle || config.name}
                  </div>
                  <div className="text-[10px] text-white/80">
                    {ui.headerSubtitle || "Online"}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Messages */}
            <div className="flex-1 p-4 space-y-3 bg-[#090d16] overflow-y-auto">
              <div className="flex gap-2">
                <div
                  className="p-3 rounded-2xl text-xs max-w-[85%] text-slate-200 bg-slate-900 border border-slate-800"
                  style={{
                    borderRadius:
                      ui.bubbleStyle === "pill"
                        ? "20px"
                        : ui.bubbleStyle === "sharp"
                        ? "4px"
                        : "16px",
                  }}
                >
                  {ui.greeting || "Hello! How can I assist you today?"}
                  {ui.showTimestamps !== false && (
                    <div className="text-[9px] text-slate-500 mt-1">10:00 AM</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <div
                  className="p-3 rounded-2xl text-xs max-w-[85%] text-white"
                  style={{
                    backgroundColor: ui.primaryColor || "#6366f1",
                    borderRadius:
                      ui.bubbleStyle === "pill"
                        ? "20px"
                        : ui.bubbleStyle === "sharp"
                        ? "4px"
                        : "16px",
                  }}
                >
                  Can you help me understand your pricing and features?
                  {ui.showTimestamps !== false && (
                    <div className="text-[9px] text-white/70 mt-1 text-right">10:01 AM</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <div
                  className="p-3 rounded-2xl text-xs max-w-[85%] text-slate-200 bg-slate-900 border border-slate-800"
                  style={{
                    borderRadius:
                      ui.bubbleStyle === "pill"
                        ? "20px"
                        : ui.bubbleStyle === "sharp"
                        ? "4px"
                        : "16px",
                  }}
                >
                  Certainly! We offer custom tiers tailored to your team's workflow with instant deployment.
                  {ui.showTimestamps !== false && (
                    <div className="text-[9px] text-slate-500 mt-1">10:01 AM</div>
                  )}
                </div>
              </div>
            </div>

            {/* Input simulator */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-500 flex-1">Type a message...</span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: ui.primaryColor || "#6366f1" }}
                >
                  &rarr;
                </div>
              </div>
              {ui.showPoweredBy !== false && (
                <div className="text-[9px] text-slate-500 text-center mt-1.5">
                  Powered by PersonaForge Studio
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
