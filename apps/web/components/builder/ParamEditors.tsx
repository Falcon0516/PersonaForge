"use client";

import React, { useState } from "react";
import { BlockDef, BlockKind } from "@personaforge/core";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";

interface ParamEditorProps {
  blockDef: BlockDef<any>;
  value: unknown;
  onChange: (val: unknown) => void;
}

export function ParamEditor({ blockDef, value, onChange }: ParamEditorProps) {
  // If the value is a structured object with multiple properties (e.g. { name: "", role: "" })
  if (typeof value === "object" && value !== null && !Array.isArray(value) && blockDef.kind !== "keyvalue") {
    const record = value as Record<string, unknown>;
    return (
      <div className="space-y-3">
        {Object.entries(record).map(([propKey, propVal]) => (
          <div key={propKey} className="space-y-1">
            <label className="text-xs font-medium text-slate-300 capitalize block">
              {propKey.replace(/([A-Z])/g, " $1")}
            </label>
            {typeof propVal === "boolean" ? (
              <button
                type="button"
                onClick={() => onChange({ ...record, [propKey]: !propVal })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  propVal ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${
                    propVal ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            ) : typeof propVal === "number" ? (
              <input
                type="number"
                value={propVal}
                onChange={(e) =>
                  onChange({ ...record, [propKey]: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono"
              />
            ) : (
              <input
                type="text"
                value={typeof propVal === "string" ? propVal : String(propVal ?? "")}
                onChange={(e) => onChange({ ...record, [propKey]: e.target.value })}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Kind-based editor for single values
  switch (blockDef.kind) {
    case "text":
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
          <input
            type="text"
            value={typeof value === "string" ? value : String(value ?? blockDef.default ?? "")}
            placeholder={blockDef.placeholder || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
          <textarea
            rows={3}
            value={typeof value === "string" ? value : String(value ?? blockDef.default ?? "")}
            placeholder={blockDef.placeholder || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono"
          />
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-center justify-between py-1">
          <div>
            <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
            <p className="text-[11px] text-slate-500">{blockDef.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${
              value ? "bg-indigo-600" : "bg-slate-800"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${
                value ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      );

    case "slider":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">{blockDef.label}</label>
            <span className="text-[11px] font-mono text-indigo-400 font-semibold">
              {String(value ?? blockDef.default ?? 0)}
            </span>
          </div>
          <input
            type="range"
            min={blockDef.min ?? 0}
            max={blockDef.max ?? 100}
            step={blockDef.step ?? 1}
            value={typeof value === "number" ? value : Number(blockDef.default) || 0}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
          <select
            value={typeof value === "string" ? value : String(blockDef.default || "")}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            {(blockDef.options || []).map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggleOption = (optVal: string) => {
        if (selected.includes(optVal)) {
          onChange(selected.filter((v) => v !== optVal));
        } else {
          onChange([...selected, optVal]);
        }
      };
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(blockDef.options || []).map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1 transition ${
                    isSelected
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "list": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return (
        <StringListEditor
          label={blockDef.label}
          items={list}
          onChange={onChange}
        />
      );
    }

    case "keyvalue": {
      const pairs = typeof value === "object" && value !== null ? (value as Record<string, string>) : {};
      return (
        <KeyValueEditor
          label={blockDef.label}
          pairs={pairs}
          onChange={onChange}
        />
      );
    }

    case "color": {
      const colorVal = typeof value === "string" ? value : "#6366f1";
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{blockDef.label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorVal}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={colorVal}
              onChange={(e) => onChange(e.target.value)}
              className="w-28 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (val: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const addItem = () => {
    if (!inputVal.trim()) return;
    onChange([...items, inputVal.trim()]);
    setInputVal("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-300 block">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          placeholder="Add item..."
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="flex-1 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          type="button"
          onClick={addItem}
          className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-slate-500 hover:text-rose-400"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyValueEditor({
  label,
  pairs,
  onChange,
}: {
  label: string;
  pairs: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const addPair = () => {
    if (!newKey.trim()) return;
    onChange({ ...pairs, [newKey.trim()]: newVal.trim() });
    setNewKey("");
    setNewVal("");
  };

  const removePair = (k: string) => {
    const updated = { ...pairs };
    delete updated[k];
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-300 block">{label}</label>

      {Object.entries(pairs).map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-1/3 text-[11px] font-mono text-indigo-300 truncate bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {k}
          </span>
          <span className="flex-1 text-[11px] text-slate-300 truncate bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {v}
          </span>
          <button
            type="button"
            onClick={() => removePair(k)}
            className="text-slate-500 hover:text-rose-400 p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="w-1/3 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="text"
          placeholder="Value"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          className="flex-1 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={addPair}
          className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
