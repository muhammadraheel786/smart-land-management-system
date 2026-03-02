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
        className={`min-h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "ml-0 md:ml-[80px]" : "ml-0 md:ml-[280px]"}`}
      >
        {/* Mobile: compact app-bar. Desktop: full-height header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b backdrop-blur-md px-3 py-2 md:px-8 md:py-3.5"
          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={toggle}
              className="hidden md:flex flex-shrink-0 items-center justify-center rounded-xl p-2 bg-theme-track border border-theme hover:bg-theme hover:text-green-500 transition-all"
              style={{ color: "var(--foreground)" }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            {/* Mobile brand mark */}
            <div className="md:hidden flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-black tracking-tight">MF</span>
            </div>
            <h2
              className="text-[13px] font-semibold truncate md:text-xl md:font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {t("appTitle")}
            </h2>
          </div>
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher />
            <VoiceCommand onCommand={handleVoiceCommand} compact />
          </div>
        </header>

        {showBanner && (
          <div className="mx-3 mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-amber-200 md:mx-8 md:mt-4 md:px-4 md:py-3">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm md:text-base">Backend unavailable</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {error}
                {(error === "API error 404" || error?.includes("Failed to fetch")) && (
                  <span className="block mt-1.5">Start: <code className="bg-black/30 px-1 py-0.5 rounded text-[10px]">python manage.py runserver</code></span>
                )}
              </p>
            </div>
            <button type="button" onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-amber-500/20 flex-shrink-0" aria-label="Dismiss">
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        )}

        {/* pb-[80px] reserves space for bottom nav on mobile */}
        <div className="p-3 pb-[80px] sm:p-5 md:p-8 md:pb-8">{children}</div>
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
