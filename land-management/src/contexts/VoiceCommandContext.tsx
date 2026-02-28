"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { VoiceCommandDef } from "@/lib/voiceCommands";

interface VoiceCommandContextValue {
  lastTranscript: string;
  lastAction: VoiceCommandDef | null;
  lastActionAt: number;
  setLastTranscript: (t: string) => void;
  setLastAction: (cmd: VoiceCommandDef | null) => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextValue | null>(null);

export function VoiceCommandProvider({ children }: { children: ReactNode }) {
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastAction, setLastAction] = useState<VoiceCommandDef | null>(null);
  const [lastActionAt, setLastActionAt] = useState(0);

  const setAction = useCallback((cmd: VoiceCommandDef | null) => {
    setLastAction(cmd);
    setLastActionAt(Date.now());
  }, []);

  return (
    <VoiceCommandContext.Provider
      value={{
        lastTranscript,
        lastAction,
        lastActionAt,
        setLastTranscript,
        setLastAction: setAction,
      }}
    >
      {children}
    </VoiceCommandContext.Provider>
  );
}

export function useVoiceCommandContext() {
  const ctx = useContext(VoiceCommandContext);
  return ctx;
}
