"use client";

import { useCallback } from "react";
import { Mic, CheckCircle2, MessageSquare } from "lucide-react";
import VoiceCommand from "@/components/VoiceCommand";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useVoiceCommandContext } from "@/contexts/VoiceCommandContext";
import { VOICE_COMMANDS, type VoiceCommandDef } from "@/lib/voiceCommands";

function VoiceCommandHandler() {
  const router = useRouter();
  const handle = useCallback((matched: VoiceCommandDef | null, _t: string) => {
    if (!matched) return;
    if (matched.action === "open_chatbot") {
      window.dispatchEvent(new CustomEvent("open-ai-chatbot"));
      return;
    }
    if (matched.action === "navigate" && matched.path) router.push(matched.path);
  }, [router]);
  return <VoiceCommand onCommand={handle} />;
}

export default function VoicePage() {
  const { t } = useLocale();
  const ctx = useVoiceCommandContext();
  const lastAction = ctx?.lastAction ?? null;
  const lastTranscript = ctx?.lastTranscript ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">{t("voiceCommands")}</h1>
        <p className="text-theme-muted">
          Control the app with your voice. Say a phrase below from any page using the header microphone, or use the mic here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Mic className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-theme mb-2">Try it here</h3>
            <p className="text-theme-muted text-center text-sm mb-4">
              Click the mic and say a command (e.g. &quot;Go to dashboard&quot;, &quot;Open map&quot;).
            </p>
            <VoiceCommandHandler />
          </div>
          <div className="border-t border-theme pt-4 space-y-2">
            {lastTranscript && (
              <p className="text-sm text-theme-muted">
                <span className="text-[#e6edf3]">Last heard:</span> {lastTranscript}
              </p>
            )}
            {lastAction && (
              <p className="text-sm text-green-400 flex items-center gap-2">
                {lastAction.action === "open_chatbot" ? (
                  <>
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span>Opened AI Chatbot</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Navigated to {t(lastAction.labelKey)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Supported commands</h3>
          <p className="text-sm text-theme-muted mb-4">
            Say any phrase that contains the trigger word(s). First match wins.
          </p>
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {VOICE_COMMANDS.map((cmd) => (
              <li key={cmd.id} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <span className="text-theme font-medium">{t(cmd.labelKey)}</span>
                  <span className="text-theme-muted ml-2">
                    ({cmd.phrases.slice(0, 3).join(", ")}{cmd.phrases.length > 3 ? "…" : ""})
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-theme-muted mt-6">
            Uses the Web Speech API. Best in Chrome, Edge, or Safari. Allow microphone when prompted.
          </p>
        </div>
      </div>
    </div>
  );
}
