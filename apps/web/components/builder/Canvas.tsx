"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Sparkles,
  Layers,
  AlertTriangle,
  BookOpen,
  Wrench,
} from "lucide-react";
import { getBlock, Conflict, BlockDef } from "@personaforge/core";
import { CanvasBlockCard } from "./CanvasBlockCard";

interface CanvasProps {
  blockOrder: string[];
  blocksMap: Record<string, unknown>;
  conflicts: Conflict[];
  onReorder: (activeId: string, overId: string) => void;
  onUpdateParams: (blockId: string, params: unknown) => void;
  onRemoveBlock: (blockId: string) => void;
  onApplyFix: (conflict: Conflict) => void;
  onOpenMagicBox: () => void;
  onOpenTemplates: () => void;
  onAddBlock: (blockId: string) => void;
}

export function Canvas({
  blockOrder,
  blocksMap,
  conflicts,
  onReorder,
  onUpdateParams,
  onRemoveBlock,
  onApplyFix,
  onOpenMagicBox,
  onOpenTemplates,
  onAddBlock,
}: CanvasProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const blockId =
      e.dataTransfer.getData("application/personaforge-block") ||
      e.dataTransfer.getData("text/plain");
    if (blockId) {
      onAddBlock(blockId);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 transition-all duration-200 ${
        isDragOver
          ? "bg-indigo-950/20 ring-2 ring-indigo-500/50 ring-inset"
          : ""
      }`}
    >
      {/* Drop Target Indicator when dragging from palette */}
      {isDragOver && (
        <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-500/15 shadow-glow flex items-center justify-center gap-2.5 text-indigo-300 font-semibold text-xs animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>Drop block here to add to Persona Canvas</span>
        </div>
      )}

      {/* Active Conflicts Summary Alert */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-200 gap-3 shadow-lg shadow-amber-500/5">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300">
                {conflicts.length} conflicting block{conflicts.length > 1 ? "s" : ""} detected:
              </span>{" "}
              <span className="text-amber-200/90">{conflicts[0]?.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            {conflicts[0]?.fix && onApplyFix && (
              <button
                type="button"
                onClick={() => onApplyFix(conflicts[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                title="Automatically reconcile instructions"
              >
                <Wrench className="w-3.5 h-3.5" />
                1-Click Fix
              </button>
            )}
            <span className="text-[11px] font-mono text-amber-400 font-semibold px-2 py-1 rounded bg-amber-500/20">
              Audit Warning
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {blockOrder.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[460px] p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-white">
              Your Persona Canvas is Empty
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag blocks from the left palette to define your bot's identity, personality, knowledge grounding, and guardrails, or start instantly from a template.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onOpenTemplates}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow transition"
            >
              <BookOpen className="w-4 h-4" /> Pick a Template
            </button>
            <button
              onClick={onOpenMagicBox}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" /> Magic Box AI
            </button>
          </div>
        </div>
      ) : (
        /* Sortable Blocks Container */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blockOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blockOrder.map((bId) => {
                const blockDef = getBlock(bId) as BlockDef<any> | undefined;
                if (!blockDef) return null;
                const params = blocksMap[bId] ?? blockDef.default;

                return (
                  <CanvasBlockCard
                    key={bId}
                    blockId={bId}
                    blockDef={blockDef}
                    params={params}
                    conflicts={conflicts}
                    onUpdateParams={(newParams) => onUpdateParams(bId, newParams)}
                    onRemove={() => onRemoveBlock(bId)}
                    onApplyFix={onApplyFix}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
