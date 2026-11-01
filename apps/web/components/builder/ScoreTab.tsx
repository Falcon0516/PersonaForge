"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { BotConfig, scorePrompt, ScoreResult, Check } from "@personaforge/core";

interface ScoreTabProps {
  config: BotConfig;
  onAddBlock?: (blockId: string) => void;
}

export function ScoreTab({ config, onAddBlock }: ScoreTabProps) {
  const report: ScoreResult = useMemo(() => {
    try {
      return scorePrompt(config);
    } catch {
      return {
        score: 0,
        checks: [],
      };
    }
  }, [config]);

  const scoreColor =
    report.score >= 85
      ? "text-emerald-400 stroke-emerald-400"
      : report.score >= 70
      ? "text-amber-400 stroke-amber-400"
      : "text-rose-400 stroke-rose-400";

  const scoreTier =
    report.score >= 85
      ? "Production Ready"
      : report.score >= 70
      ? "Good — Minor Improvements Possible"
      : "Needs Refinement";

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  const failedChecksWithHints = report.checks.filter((c: Check) => !c.passed && c.actionHint);

  return (
    <div className="flex flex-col h-full bg-slate-950/70 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Score Header with Radial Gauge */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Award className="w-4 h-4 text-indigo-400" /> Quality Audit Score
          </div>
          <h3 className="text-xl font-bold text-white">{scoreTier}</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Deterministic offline evaluation across 9 production readiness checks.
          </p>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`${scoreColor} transition-all duration-700 ease-out`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-black font-mono ${scoreColor}`}>
              {report.score}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              / 100
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Suggestions */}
      {failedChecksWithHints.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Recommendations to Boost Score
          </div>
          <ul className="space-y-1.5">
            {failedChecksWithHints.map((chk: Check) => (
              <li
                key={chk.id}
                className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
              >
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{chk.title}:</strong> {chk.actionHint}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 9 Quality Checks Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Criteria Breakdown
        </h4>

        <div className="space-y-2">
          {report.checks.map((chk: Check) => (
            <div
              key={chk.id}
              className={`p-3 rounded-xl border transition ${
                chk.passed
                  ? "bg-slate-900/40 border-slate-800"
                  : "bg-rose-950/20 border-rose-900/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {chk.title}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {chk.description}
                    </p>
                    {!chk.passed && chk.actionHint && (
                      <div className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        {chk.actionHint}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      chk.passed
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {chk.passed ? `+${chk.scoreDelta}` : `${chk.scoreDelta}`} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
