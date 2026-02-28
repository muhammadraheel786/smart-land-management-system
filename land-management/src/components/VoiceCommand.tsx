"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { matchVoiceCommand, type VoiceCommandDef } from "@/lib/voiceCommands";
import { useVoiceCommandContext } from "@/contexts/VoiceCommandContext";

export type VoiceCommandHandler = (matched: VoiceCommandDef | null, transcript: string) => void;

interface VoiceCommandProps {
  /** Called when a final transcript is in; receives matched command (or null) and raw text */
  onCommand?: VoiceCommandHandler;
  /** Compact mode: hide transcript and feedback (e.g. header) */
  compact?: boolean;
}

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceCommand({ onCommand, compact = false }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const ctx = useVoiceCommandContext();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    setMounted(true);
    setSupported(!!SpeechRecognitionClass);
    if (!SpeechRecognitionClass) return;
    const rec = new SpeechRecognitionClass() as SpeechRecognition;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("")
        .trim();
      setTranscript(text);
      const last = e.results[e.results.length - 1];
      if (last?.isFinal && text) {
        const matched = matchVoiceCommand(text);
        ctx?.setLastTranscript(text);
        if (matched) {
          ctx?.setLastAction(matched);
          onCommand?.(matched, text);
        } else {
          ctx?.setLastAction(null);
          onCommand?.(null, text);
        }
      }
    };

    rec.onerror = (e: Event) => {
      const ev = e as { error?: string };
      const err = ev.error ?? "unknown";
      if (err === "no-speech") {
        setError("No speech detected. Try again.");
        setTimeout(() => setError(null), 3000);
      } else if (err === "not-allowed" || err === "service-not-allowed") {
        setError("Microphone access denied.");
        setIsListening(false);
      } else if (err === "network") {
        setError("Network error. Check connection.");
        setIsListening(false);
      } else if (err === "aborted") {
        setError(null);
      } else {
        setError(`Recognition error: ${err}`);
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [onCommand, ctx]);

  const toggle = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setError(null);
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      try {
        rec.start();
        setIsListening(true);
      } catch (e) {
        setError("Could not start microphone.");
      }
    }
  }, [isListening]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-theme-track border border-theme p-3 text-theme-muted">
          <Mic className="w-5 h-5" />
        </span>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="flex items-center gap-2" title="Voice not supported in this browser">
        <span className="rounded-full bg-theme-track border border-theme p-3 text-theme-muted">
          <Mic className="w-5 h-5" />
        </span>
        {!compact && (
          <span className="text-xs text-theme-muted max-w-[140px]">
            Use Chrome, Edge, or Safari for voice
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`p-3 rounded-full transition-all border border-theme ${
          isListening
            ? "bg-red-500 text-white animate-pulse border-red-500"
            : "bg-theme-track text-theme-muted hover:bg-theme-card hover:text-theme"
        }`}
        title={isListening ? "Stop listening" : "Start voice command"}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      {!compact && (
        <>
          {error && (
            <span className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 max-w-[180px]" title={error}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </span>
          )}
          {!error && transcript && (
            <span className="text-sm text-theme-muted max-w-[200px] truncate" title={transcript}>
              {transcript}
            </span>
          )}
        </>
      )}
    </div>
  );
}
