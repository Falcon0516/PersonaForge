"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BotConfig,
  Channel,
  agricultureTemplate,
  detectConflicts,
  scorePrompt,
  Conflict,
  getBlock,
} from "@personaforge/core";
import { RightTab, VersionSnapshot } from "@/lib/builder/types";
import { BuilderHeader } from "@/components/builder/BuilderHeader";
import { BlockPalette } from "@/components/builder/BlockPalette";
import { Canvas } from "@/components/builder/Canvas";
import { RightPanel } from "@/components/builder/RightPanel";
import { MagicBoxModal } from "@/components/builder/MagicBoxModal";
import { TemplateModal } from "@/components/builder/TemplateModal";
import { VersionDrawer } from "@/components/builder/VersionDrawer";
import { CommandPalette } from "@/components/builder/CommandPalette";
import { PublishModal } from "@/components/builder/PublishModal";
import { OnboardingTour } from "@/components/builder/OnboardingTour";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const botId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "draft";

  // Initial Bot State (deterministic for SSR)
  const [config, setConfig] = useState<BotConfig>(() => {
    const initial = JSON.parse(JSON.stringify(agricultureTemplate.config));
    initial.id = botId;
    return initial;
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<BotConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load saved bot or generate fresh UUID client-side to prevent hydration mismatch #418
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`pf_bot_${botId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConfig(parsed);
          setHistory([parsed]);
          return;
        } catch {}
      }
      if (botId === "new") {
        setConfig((prev) => ({ ...prev, id: crypto.randomUUID() }));
      }
    }
  }, [botId]);

  // UI state
  const [activeChannel, setActiveChannel] = useState<Channel>("web");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Light / Dark Theme Mode
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("pf_builder_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("pf_builder_theme", next);
        document.documentElement.classList.toggle("light", next === "light");
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("light", theme === "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  // Modals
  const [isMagicBoxOpen, setIsMagicBoxOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Version snapshots
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // Load versions from localStorage
  useEffect(() => {
    const savedVers = localStorage.getItem(`pf_versions_${botId}`);
    if (savedVers) {
      try {
        setVersions(JSON.parse(savedVers));
      } catch {}
    }
  }, [botId]);

  // Push new state to history stack
  const updateConfigWithHistory = useCallback(
    (newConfig: BotConfig) => {
      setSaveStatus("unsaved");
      setConfig(newConfig);

      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newConfig);
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Autosave debounced
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`pf_bot_${botId}`, JSON.stringify(config));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [config, botId]);

  // Undo / Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const prevIdx = historyIndex - 1;
    setHistoryIndex(prevIdx);
    setConfig(history[prevIdx]!);
    setSaveStatus("unsaved");
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setConfig(history[nextIdx]!);
    setSaveStatus("unsaved");
  }, [canRedo, historyIndex, history]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Add block to canvas
  const handleAddBlock = (blockId: string) => {
    const order = config.blockOrder ? [...config.blockOrder] : Object.keys(config.blocks);
    if (!order.includes(blockId)) {
      order.push(blockId);
    }

    const blockDef = getBlock(blockId);
    const defaultVal = blockDef ? blockDef.default : {};
    const defaultParams =
      typeof defaultVal === "object" && defaultVal !== null
        ? { ...(defaultVal as Record<string, unknown>) }
        : defaultVal;

    const updated: BotConfig = {
      ...config,
      blocks: {
        ...config.blocks,
        [blockId]: config.blocks[blockId] || defaultParams,
      },
      blockOrder: order,
    };

    updateConfigWithHistory(updated);
  };

  // Remove block from canvas
  const handleRemoveBlock = (blockId: string) => {
    const order = (config.blockOrder || Object.keys(config.blocks)).filter((id) => id !== blockId);
    const newBlocks = { ...config.blocks };
    delete newBlocks[blockId];

    const updated: BotConfig = {
      ...config,
      blocks: newBlocks,
      blockOrder: order,
    };

    updateConfigWithHistory(updated);
  };

  // Update block params
  const handleUpdateBlockParams = (blockId: string, params: unknown) => {
    const updated: BotConfig = {
      ...config,
      blocks: {
        ...config.blocks,
        [blockId]: params,
      },
    };
    updateConfigWithHistory(updated);
  };

  // Reorder blocks on canvas
  const handleReorder = (activeId: string, overId: string) => {
    const order = config.blockOrder ? [...config.blockOrder] : Object.keys(config.blocks);
    const oldIndex = order.indexOf(activeId);
    const newIndex = order.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...order];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, activeId);

    const updated: BotConfig = {
      ...config,
      blockOrder: newOrder,
    };
    updateConfigWithHistory(updated);
  };

  // 1-Click Conflict Fix
  const handleApplyFix = (conflict: Conflict) => {
    if (!conflict.fix) return;
    const patch = conflict.fix;
    const newBlocks = { ...config.blocks };
    const order = config.blockOrder ? [...config.blockOrder] : Object.keys(config.blocks);

    if (patch.action === "remove" && patch.blockId) {
      delete newBlocks[patch.blockId];
      const newOrder = order.filter((id) => id !== patch.blockId);
      updateConfigWithHistory({
        ...config,
        blocks: newBlocks,
        blockOrder: newOrder,
      });
    } else if (patch.action === "set" && patch.blockId) {
      newBlocks[patch.blockId] = patch.value;
      updateConfigWithHistory({
        ...config,
        blocks: newBlocks,
      });
    }
  };

  // Create Snapshot
  const handleCreateSnapshot = (label: string) => {
    const score = scorePrompt(config).score;
    const newSnapshot: VersionSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString(),
      name: label,
      config: JSON.parse(JSON.stringify(config)),
      score,
    };

    const nextVersions = [newSnapshot, ...versions];
    setVersions(nextVersions);
    localStorage.setItem(`pf_versions_${botId}`, JSON.stringify(nextVersions));
  };

  // Restore Snapshot
  const handleRestoreSnapshot = (snapshot: VersionSnapshot) => {
    updateConfigWithHistory(JSON.parse(JSON.stringify(snapshot.config)));
  };

  // Remix / Randomize Persona
  const handleRemix = () => {
    const tonePresets = [
      "tone.friendly",
      "tone.professional",
      "tone.empathetic",
      "tone.playful",
      "tone.concise",
    ];
    const pickedTone = tonePresets[Math.floor(Math.random() * tonePresets.length)]!;
    handleAddBlock(pickedTone);
  };

  // Detect active conflicts
  const activeConflicts = useMemo(() => {
    return detectConflicts(config);
  }, [config]);

  const blockOrder = useMemo(() => {
    return config.blockOrder || Object.keys(config.blocks);
  }, [config]);

  return (
    <ErrorBoundary>
      <div
        className={`flex flex-col h-screen overflow-hidden transition-colors duration-200 ${
          theme === "light" ? "light bg-slate-50 text-slate-900" : "dark bg-background text-foreground"
        }`}
      >
      {/* Top Header */}
      <BuilderHeader
        config={config}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onUpdateMetadata={(name, slug) =>
          updateConfigWithHistory({ ...config, name, slug })
        }
        onToggleMode={(mode) =>
          updateConfigWithHistory({ ...config, mode })
        }
        onOpenMagicBox={() => setIsMagicBoxOpen(true)}
        onRemix={handleRemix}
        onOpenVersions={() => setIsVersionsOpen(true)}
        onOpenPublish={() => setIsPublishOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Block Palette (320px) */}
        <aside className="w-80 flex-shrink-0 hidden md:block border-r border-slate-800">
          <BlockPalette
            canvasBlockIds={blockOrder}
            botMode={config.mode}
            onAddBlock={handleAddBlock}
          />
        </aside>

        {/* Center Pane: Visual Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40">
          <Canvas
            blockOrder={blockOrder}
            blocksMap={config.blocks as Record<string, unknown>}
            conflicts={activeConflicts}
            onReorder={handleReorder}
            onUpdateParams={handleUpdateBlockParams}
            onRemoveBlock={handleRemoveBlock}
            onApplyFix={handleApplyFix}
            onOpenMagicBox={() => setIsMagicBoxOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onAddBlock={handleAddBlock}
          />
        </main>

        {/* Right Pane: Multi-Tab Inspector & Preview (440px) */}
        <aside className="w-[440px] flex-shrink-0 hidden lg:block">
          <RightPanel
            config={config}
            channel={activeChannel}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onChangeChannel={setActiveChannel}
            onAddBlock={handleAddBlock}
          />
        </aside>
      </div>

      {/* Modals & Drawers */}
      <MagicBoxModal
        isOpen={isMagicBoxOpen}
        onClose={() => setIsMagicBoxOpen(false)}
        onApplyConfig={(newConf) => updateConfigWithHistory(newConf)}
      />

      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(templateConf) => updateConfigWithHistory(templateConf)}
      />

      <VersionDrawer
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        versions={versions}
        onRestore={handleRestoreSnapshot}
        onCreateSnapshot={handleCreateSnapshot}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onAddBlock={handleAddBlock}
        onOpenMagicBox={() => setIsMagicBoxOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenPublish={() => setIsPublishOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        config={config}
        onExportHtml={async (mode) => {
          // Triggers HTML export
          window.open(`/api/bots/${config.id}/export/html?mode=${mode}`, "_blank");
        }}
      />

      <OnboardingTour />
      </div>
    </ErrorBoundary>
  );
}
