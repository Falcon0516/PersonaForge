"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Settings2,
  Radio,
  Sparkles,
} from "lucide-react";
import { BotConfig, VOICE_CAPABILITIES } from "@personaforge/core";
import { VoiceOrb, OrbState } from "./VoiceOrb";

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
}

export function VoiceAgentModal({ isOpen, onClose, config }: VoiceAgentModalProps) {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [captions, setCaptions] = useState<string>("Click the microphone to start talking...");
  const [speaker, setSpeaker] = useState(config.voice?.speaker || "shruti");
  const [language, setLanguage] = useState(config.voice?.language || "hi-IN");
  const [handsFree, setHandsFree] = useState(config.voice?.handsFree || false);
  const [bargeIn, setBargeIn] = useState(config.voice?.bargeIn !== false);

  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current.forEach((a) => a.pause());
    audioQueueRef.current = [];
    if (orbState === "speaking") {
      setOrbState("idle");
    }
  }, [orbState]);

  // Stop audio on unmount or close
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0) {
      currentAudioRef.current = null;
      setOrbState("idle");
      return;
    }

    setOrbState("speaking");
    const nextAudio = audioQueueRef.current.shift()!;
    currentAudioRef.current = nextAudio;

    nextAudio.onended = () => {
      playNextInQueue();
    };

    nextAudio.onerror = () => {
      playNextInQueue();
    };

    nextAudio.play().catch(() => {
      playNextInQueue();
    });
  };

  const queueAudioBase64 = (base64Wav: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
      audioQueueRef.current.push(audio);
      if (!currentAudioRef.current) {
        playNextInQueue();
      }
    } catch {
      // Audio playback fallback
    }
  };

  const handleStartRecording = async () => {
    // Instant Barge-in: User talking immediately interrupts bot playback
    if (bargeIn) {
      stopAllAudio();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processUserAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setOrbState("listening");
      setCaptions("Listening to you...");
    } catch {
      // If microphone not available in dev, simulate voice interaction
      simulateVoiceQuery();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setOrbState("thinking");
      setCaptions("Processing speech...");
    }
  };

  const simulateVoiceQuery = async () => {
    setIsRecording(false);
    setOrbState("thinking");
    setCaptions("Farmer: 'Mere khet me tamatar me keede lag gaye hain'");

    // Send query to preview stream
    await sendVoiceQuery("Mere khet me tamatar me keede lag gaye hain");
  };

  const processUserAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "speech.wav");
      formData.append("language_code", language);

      const sttRes = await fetch(`/api/public/bots/${config.id}/stt`, {
        method: "POST",
        body: formData,
      });

      const sttData = await sttRes.json();
      const userText = sttData.transcript || "Namaste";
      setCaptions(`You: "${userText}"`);

      await sendVoiceQuery(userText);
    } catch {
      simulateVoiceQuery();
    }
  };

  const sendVoiceQuery = async (queryText: string) => {
    setOrbState("thinking");

    try {
      const chatRes = await fetch("/api/preview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          messages: [{ role: "user", content: queryText }],
          channel: "voice",
        }),
      });

      if (!chatRes.ok || !chatRes.body) {
        setCaptions("Error communicating with voice agent");
        setOrbState("idle");
        return;
      }

      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (trimmed.startsWith("event: sentence")) {
            const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(5).trim());
                if (parsed.sentence) {
                  setCaptions(`Bot: "${parsed.sentence}"`);
                  // Synthesize sentence via TTS
                  synthesizeSentenceAudio(parsed.sentence);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setCaptions(`Error: ${String(err)}`);
      setOrbState("idle");
    }
  };

  const synthesizeSentenceAudio = async (sentence: string) => {
    try {
      const res = await fetch(`/api/public/bots/${config.id}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sentence,
          target_language_code: language,
          speaker,
          pace: config.voice?.pace ?? 1.0,
        }),
      });

      const data = await res.json();
      if (data.audios && data.audios[0]) {
        queueAudioBase64(data.audios[0]);
      }
    } catch {
      // Audio queue error handling
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 md:p-8 border-violet-500/30 shadow-2xl flex flex-col items-center justify-between min-h-[580px] relative overflow-hidden">
        {/* Top Controls Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {config.name} Voice Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  BulBul v3 &bull; Saarika v2.5
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Animated Visual Orb */}
        <div className="my-8 flex flex-col items-center justify-center space-y-6">
          <VoiceOrb state={orbState} size={200} />

          {/* State Indicator */}
          <div className="text-center space-y-1">
            <div
              className={`text-xs font-semibold uppercase tracking-wider capitalize ${
                orbState === "listening"
                  ? "text-cyan-400"
                  : orbState === "thinking"
                  ? "text-amber-400"
                  : orbState === "speaking"
                  ? "text-violet-400"
                  : "text-slate-400"
              }`}
            >
              {orbState}
            </div>
            <p className="text-xs text-slate-300 max-w-md px-4 leading-relaxed font-mono">
              {captions}
            </p>
          </div>
        </div>

        {/* Bottom Voice Controls */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              onTouchStart={handleStartRecording}
              onTouchEnd={handleStopRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform transform active:scale-95 ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow"
              }`}
              title="Hold to speak"
            >
              {isRecording ? <Mic className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            <button
              onClick={simulateVoiceQuery}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
              title="Simulate speech query in Hindi"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate Voice</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Press and hold mic to speak &bull; Release to send &bull; Instant barge-in active
          </p>

          {/* Voice Settings Bar */}
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Speaker:</span>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 capitalize font-mono"
              >
                {VOICE_CAPABILITIES.tts.speakersByModel["bulbul:v3"]?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
              >
                {VOICE_CAPABILITIES.tts.supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={bargeIn}
                onChange={(e) => setBargeIn(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
              />
              Barge-in interrupt
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
