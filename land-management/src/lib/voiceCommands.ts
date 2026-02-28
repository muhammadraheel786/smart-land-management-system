/**
 * Central voice command definitions for production.
 * Phrases are matched case-insensitively; first match wins.
 */

export type VoiceAction = "navigate" | "open_chatbot";

export interface VoiceCommandDef {
  id: string;
  /** i18n key for sidebar/labels (e.g. "dashboard") */
  labelKey: string;
  /** Path to navigate to (for navigate). Ignored for open_chatbot. */
  path: string;
  action: VoiceAction;
  /** Trigger words/phrases (user utterance must contain one of these) */
  phrases: string[];
}

export const VOICE_COMMANDS: VoiceCommandDef[] = [
  { id: "dashboard", labelKey: "dashboard", path: "/dashboard", action: "navigate", phrases: ["dashboard", "home", "main"] },
  { id: "data-bank", labelKey: "dataBank", path: "/data-bank", action: "navigate", phrases: ["data bank", "database"] },
  { id: "materials", labelKey: "materials", path: "/materials", action: "navigate", phrases: ["materials", "materials inventory"] },
  { id: "field-recommendations", labelKey: "fieldRecommendations", path: "/field-recommendations", action: "navigate", phrases: ["field recommendations", "recommendations"] },
  { id: "map", labelKey: "landMap", path: "/map", action: "navigate", phrases: ["map", "land map", "show map"] },
  { id: "expenses", labelKey: "expensesIncome", path: "/expenses", action: "navigate", phrases: ["expenses", "income", "expense", "money", "wallet"] },
  { id: "thaka", labelKey: "thakaManagement", path: "/thaka", action: "navigate", phrases: ["thaka", "lease", "rented", "tenant"] },
  { id: "water", labelKey: "waterManagement", path: "/water", action: "navigate", phrases: ["water", "irrigation", "water records"] },
  { id: "temperature", labelKey: "temperatureManagement", path: "/temperature", action: "navigate", phrases: ["temperature", "temp", "weather"] },
  { id: "statistics", labelKey: "statistics", path: "/statistics", action: "navigate", phrases: ["statistics", "stats", "charts"] },
  { id: "fields", labelKey: "fieldAnalytics", path: "/fields", action: "navigate", phrases: ["fields", "field analytics", "field list"] },
  { id: "predictions", labelKey: "predictions", path: "/predictions", action: "navigate", phrases: ["predictions", "predict", "yield"] },
  { id: "satellite", labelKey: "satelliteMonitor", path: "/satellite", action: "navigate", phrases: ["satellite", "satellite monitor", "imagery"] },
  { id: "ai", labelKey: "aiInsights", path: "/ai", action: "navigate", phrases: ["ai insights", "ai insight", "insights"] },
  { id: "chatbot", labelKey: "aiChatbot", path: "/chatbot", action: "open_chatbot", phrases: ["chatbot", "chat", "open chat", "ai chat"] },
  { id: "voice", labelKey: "voiceCommands", path: "/voice", action: "navigate", phrases: ["voice", "voice commands", "microphone"] },
  { id: "export", labelKey: "exportData", path: "/export", action: "navigate", phrases: ["export", "export data", "download"] },
];

/**
 * Match user transcript to a command. Returns first matching command or null.
 */
export function matchVoiceCommand(transcript: string): VoiceCommandDef | null {
  const lower = transcript.toLowerCase().trim();
  if (!lower) return null;
  for (const cmd of VOICE_COMMANDS) {
    const found = cmd.phrases.some((p) => lower.includes(p.toLowerCase()));
    if (found) return cmd;
  }
  return null;
}
