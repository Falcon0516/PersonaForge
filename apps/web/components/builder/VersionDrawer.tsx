"use client";

import React, { useState } from "react";
import { History, X, RotateCcw, Plus, Clock, Award, Trash2 } from "lucide-react";
import { VersionSnapshot } from "@/lib/builder/types";

interface VersionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  onRestore: (version: VersionSnapshot) => void;
  onCreateSnapshot: (label: string) => void;
}

export function VersionDrawer({
  isOpen,
  onClose,
  versions,
  onRestore,
  onCreateSnapshot,
}: VersionDrawerProps) {
  const [label, setLabel] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!label.trim()) return;
    onCreateSnapshot(label.trim());
    setLabel("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Version Snapshots</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Creation Form */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Save Current State Snapshot
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              placeholder="e.g. Added PII guardrails & Hindi tone"
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreate}
              disabled={!label.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Snapshots List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-1">
              <Clock className="w-6 h-6 mx-auto opacity-50 mb-2" />
              <p>No snapshots saved yet.</p>
              <p className="text-[11px] text-slate-600">
                Snapshots let you restore any earlier bot iteration.
              </p>
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{ver.name}</h4>
                    <span className="text-[10px] text-slate-500">{ver.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Award className="w-3 h-3" />
                    <span>{ver.score}/100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">
                    {ver.config.blockOrder?.length || Object.keys(ver.config.blocks).length} blocks
                  </span>
                  <button
                    onClick={() => {
                      onRestore(ver);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
