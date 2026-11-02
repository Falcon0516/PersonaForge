"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GripVertical } from "lucide-react";

export interface PanelResizeHandleProps {
  /** "left" handles resizing for the left panel, "right" handles the right panel */
  direction: "left" | "right";
  /** Current width in px to show in the live badge */
  currentWidth: number;
  /** Default width in px for reset tooltip */
  defaultWidth?: number;
  /** Callback fired when drag gesture starts */
  onResizeStart?: () => void;
  /** Callback fired continuously during drag with deltaX from start position */
  onResize: (deltaX: number) => void;
  /** Callback fired when drag gesture ends */
  onResizeEnd?: () => void;
  /** Callback fired when handle is double-clicked (typically resets to default width) */
  onDoubleClick?: () => void;
  /** Extra container CSS classes */
  className?: string;
  /** Accessible label / tooltip */
  label?: string;
}

export function PanelResizeHandle({
  direction,
  currentWidth,
  defaultWidth = direction === "left" ? 320 : 440,
  onResizeStart,
  onResize,
  onResizeEnd,
  onDoubleClick,
  className = "",
  label,
}: PanelResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);

  // Global styles during active drag to lock cursor and avoid text selection
  useEffect(() => {
    if (!isDragging) return;

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return; // Only primary mouse button

      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget;
      pointerIdRef.current = e.pointerId;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }

      startXRef.current = e.clientX;
      setIsDragging(true);
      onResizeStart?.();
    },
    [onResizeStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - startXRef.current;
      onResize(deltaX);
    },
    [isDragging, onResize]
  );

  const endDrag = useCallback(
    (target: HTMLDivElement | null, pointerId: number | null) => {
      if (!isDragging) return;

      if (target && pointerId !== null) {
        try {
          if (target.hasPointerCapture(pointerId)) {
            target.releasePointerCapture(pointerId);
          }
        } catch {
          // Safe fallback
        }
      }

      pointerIdRef.current = null;
      setIsDragging(false);
      onResizeEnd?.();
    },
    [isDragging, onResizeEnd]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      endDrag(e.currentTarget, e.pointerId);
    },
    [endDrag]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endDrag(e.currentTarget, e.pointerId);
    },
    [endDrag]
  );

  const handleHandleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick?.();
    },
    [onDoubleClick]
  );

  const tooltipText =
    label ||
    `Drag to resize ${
      direction === "left" ? "Block Palette" : "Inspector & Preview"
    } • Double-click to reset (${defaultWidth}px)`;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-label={label || `${direction} panel resize handle`}
      tabIndex={0}
      title={tooltipText}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={handleHandleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ touchAction: "none" }}
      className={`relative flex-shrink-0 w-[1px] flex items-center justify-center cursor-col-resize select-none z-20 group transition-colors ${
        isDragging
          ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)]"
          : isHovered
          ? "bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)]"
          : "bg-slate-800"
      } ${className}`}
    >
      {/* Invisible expanded hit area for effortless clicking and dragging (14px wide) */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize z-10" />

      {/* Centered Grabber Grip Pill */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-3.5 h-8 rounded-full border transition-all duration-150 pointer-events-none z-30 ${
          isDragging
            ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-110"
            : isHovered
            ? "bg-slate-900 border-indigo-500/70 text-indigo-300 shadow-md scale-105"
            : "bg-slate-950/90 border-slate-700/60 text-slate-500 opacity-60 group-hover:opacity-100"
        }`}
      >
        <GripVertical className="w-2.5 h-2.5" />
      </div>

      {/* Floating Width Indicator Badge (Visible while dragging) */}
      {isDragging && (
        <div
          className={`absolute top-12 ${
            direction === "left" ? "left-3" : "right-3"
          } px-2.5 py-1 bg-slate-950/95 border border-indigo-500/60 rounded-md text-[11px] font-mono text-indigo-200 shadow-2xl pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-slate-400">
            {direction === "left" ? "Palette:" : "Inspector:"}
          </span>
          <span className="font-semibold text-white">{Math.round(currentWidth)}px</span>
        </div>
      )}
    </div>
  );
}
