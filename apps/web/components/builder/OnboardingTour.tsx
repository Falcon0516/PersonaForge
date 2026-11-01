"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, ArrowRight, ArrowLeft, Check, Layers, Play, Share2 } from "lucide-react";

interface OnboardingTourProps {
  onComplete?: () => void;
}

const STEPS = [
  {
    title: "1. Modular Block Palette",
    description:
      "Explore 120+ specialized blocks across 15 categories. Add identity, tone, industry rules, knowledge grounding, and safety guardrails to your bot.",
    icon: Layers,
  },
  {
    title: "2. Visual Canvas & Conflict Detection",
    description:
      "Drag & drop blocks to set precedence. Tweak parameters with inline editors, and get instant conflict alerts with 1-click fixes if rules clash.",
    icon: Sparkles,
  },
  {
    title: "3. Live Multi-Channel Preview & Quality Score",
    description:
      "Test streaming responses live across Web, WhatsApp, and Voice. View the exact line-by-line prompt compiler trace and deterministic 0–100 quality score.",
    icon: Play,
  },
  {
    title: "4. One-Click Publish & Standalone HTML",
    description:
      "Deploy instantly to a hosted link, embed anywhere with a simple script tag, or download a zero-dependency single-file HTML chatbot in Hosted or BYOK mode.",
    icon: Share2,
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("pf_tour_completed");
    if (!seen) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const step = STEPS[currentStep]!;
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("pf_tour_completed", "true");
      setVisible(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("pf_tour_completed", "true");
    setVisible(false);
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border-indigo-500/40 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Welcome to PersonaForge
            </span>
          </div>
          <button onClick={handleSkip} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">{step.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep ? "w-6 bg-indigo-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="p-2 rounded-lg text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow transition"
            >
              <span>{currentStep === STEPS.length - 1 ? "Get Started" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
