"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import VoiceCommand from "@/components/VoiceCommand";
import AIChatbot from "@/components/AIChatbot";
import { useLandStore } from "@/lib/store";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { VoiceCommandProvider } from "@/contexts/VoiceCommandContext";
import { AlertCircle, X, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import type { VoiceCommandDef } from "@/lib/voiceCommands";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { fetchAll, error } = useLandStore();
  const { t } = useLocale();
  const { collapsed, toggle } = useSidebar();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("smartland_token")) {
      router.replace("/");
    }
  }, [router, isLoggedIn]);

  const handleVoiceCommand = useCallback((matched: VoiceCommandDef | null, _transcript: string) => {
    if (!matched) return;
    if (matched.action === "open_chatbot") {
      window.dispatchEvent(new CustomEvent("open-ai-chatbot"));
      return;
    }
    if (matched.action === "navigate" && matched.path) {
      router.push(matched.path);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Show backend warning banner only when there's a connection error
  const showBanner = !!error && !dismissed;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main
        className={`min-h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "ml-0 md:ml-[80px]" : "ml-0 md:ml-[280px]"
          }`}
      >
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-4 backdrop-blur sm:px-6 md:px-8"
          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="hidden md:flex rounded-lg p-2 transition-colors hover:opacity-80"
              style={{ color: "var(--foreground)" }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold sm:text-xl" style={{ color: "var(--foreground)" }}>{t("appTitle")}</h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <VoiceCommand onCommand={handleVoiceCommand} compact />
          </div>
        </header>
        {showBanner && (
          <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-amber-200 sm:mx-6 md:mx-8">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">Backend unavailable</p>
              <p className="text-sm text-amber-200/80 mt-0.5">
                {error}
                {(error === "API error 404" || error?.includes("Failed to fetch")) && (
                  <span className="block mt-2">Start the backend: <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">cd backend &amp;&amp; venv\Scripts\activate &amp;&amp; python manage.py runserver</code></span>
                )}
              </p>
            </div>
            <button type="button" onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-amber-500/20" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4 pb-24 sm:p-6 md:p-8 md:pb-8">{children}</div>
      </main>
      <AIChatbot />
      <BottomNav />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <VoiceCommandProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </VoiceCommandProvider>
    </SidebarProvider>
  );
}
