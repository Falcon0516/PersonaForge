"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Tag,
  Zap,
} from "lucide-react";
import { BlockDef, Conflict } from "@personaforge/core";
import { ParamEditor } from "./ParamEditors";

interface CanvasBlockCardProps {
  blockId: string;
  blockDef: BlockDef<any>;
  params: unknown;
  conflicts: Conflict[];
  onUpdateParams: (params: unknown) => void;
  onRemove: () => void;
  onApplyFix?: (conflict: Conflict) => void;
}

export function CanvasBlockCard({
  blockId,
  blockDef,
  params,
  conflicts,
  onUpdateParams,
  onRemove,
  onApplyFix,
}: CanvasBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showWhyPopover, setShowWhyPopover] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: blockId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1,
  };

  const activeConflict = conflicts.find(
    (c) => c.blockA === blockId || c.blockB === blockId
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel rounded-xl transition duration-150 border ${
        activeConflict
          ? "border-amber-500/50 shadow-amber-500/10 shadow-lg"
          : isDragging
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : "border-slate-800 hover:border-slate-700/80"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800/60 bg-slate-900/40 rounded-t-xl gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
            title="Drag to reorder"
            aria-label="Drag handle"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Title & Category Badge */}
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-200 truncate">
              {blockDef.label}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-indigo-300 border border-slate-700">
              {blockDef.category}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" /> p:{blockDef.priority}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Why does this exist? Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWhyPopover(!showWhyPopover)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Why does this exist?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showWhyPopover && (
              <div className="absolute right-0 top-8 z-50 w-72 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-2 text-slate-300 animate-fade-in">
                <div className="flex items-center justify-between font-semibold text-white border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    Block Metadata
                  </span>
                  <button
                    onClick={() => setShowWhyPopover(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">{blockDef.description}</p>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">Section:</span>{" "}
                    <span className="font-mono text-indigo-300">{blockDef.section}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Priority:</span>{" "}
                    <span className="font-mono text-slate-300">{blockDef.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Channels:</span>{" "}
                    <span className="font-mono text-slate-300">
                      {blockDef.channels.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expand/Collapse toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Remove block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conflict Warning Ribbon */}
      {activeConflict && (
        <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="truncate">{activeConflict.message}</span>
          </div>
          {activeConflict.fix && onApplyFix && (
            <button
              type="button"
              onClick={() => onApplyFix(activeConflict)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-medium flex-shrink-0 transition"
            >
              <Wrench className="w-3 h-3" />
              1-Click Fix
            </button>
          )}
        </div>
      )}

      {/* Inline Parameter Editors Body */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/30 rounded-b-xl">
          <ParamEditor
            blockDef={blockDef}
            value={params}
            onChange={(val) => onUpdateParams(val)}
          />
        </div>
      )}
    </div>
  );
}
