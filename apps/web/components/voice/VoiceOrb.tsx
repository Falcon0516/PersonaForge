"use client";

import React from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  volumeLevel?: number; // 0 to 1
  size?: number;
}

export function VoiceOrb({ state, volumeLevel = 0.2, size = 180 }: VoiceOrbProps) {
  const scale = 1 + (state === "listening" || state === "speaking" ? volumeLevel * 0.35 : 0);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer Glow Halo */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 opacity-60 ${
          state === "listening"
            ? "bg-cyan-500/40"
            : state === "thinking"
            ? "bg-amber-500/30"
            : state === "speaking"
            ? "bg-violet-500/50"
            : "bg-indigo-500/30"
        }`}
        style={{ transform: `scale(${scale * 1.2})` }}
      />

      {/* Ripple Rings for Speaking / Listening */}
      {(state === "listening" || state === "speaking") && (
        <>
          <div
            className={`absolute inset-0 rounded-full border border-dashed animate-ping opacity-30 ${
              state === "listening" ? "border-cyan-400" : "border-violet-400"
            }`}
            style={{ animationDuration: "2.4s" }}
          />
          <div
            className={`absolute -inset-4 rounded-full border opacity-20 animate-pulse ${
              state === "listening" ? "border-cyan-300" : "border-violet-300"
            }`}
          />
        </>
      )}

      {/* Thinking Spinning Ring */}
      {state === "thinking" && (
        <div className="absolute -inset-3 rounded-full border-2 border-transparent border-t-amber-400 border-r-indigo-400 animate-spin" />
      )}

      {/* Core Orb Sphere */}
      <div
        className={`relative w-3/4 h-3/4 rounded-full transition-transform duration-150 flex items-center justify-center shadow-2xl ${
          state === "listening"
            ? "bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 shadow-cyan-500/50"
            : state === "thinking"
            ? "bg-gradient-to-tr from-indigo-700 via-purple-600 to-amber-500 shadow-amber-500/40"
            : state === "speaking"
            ? "bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-400 shadow-violet-500/50"
            : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-indigo-500/40"
        }`}
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {/* Inner Glass Highlight */}
        <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-white/30 blur-[2px]" />

        {/* State Icon / Center Pulse */}
        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              state === "listening"
                ? "bg-cyan-200 animate-ping"
                : state === "thinking"
                ? "bg-amber-200 animate-spin"
                : state === "speaking"
                ? "bg-violet-200 animate-pulse"
                : "bg-white/80"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
