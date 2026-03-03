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
    <div className="min-h-screen min-h-dvh bg-theme text-theme overflow-x-hidden">
      <Sidebar />
      <main
        className={`flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "md:ml-[80px]" : "md:ml-[280px]"}`}
      >
        {/* Header - Sleek Modern Nav */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-theme bg-theme-card/80 backdrop-blur-xl px-4 py-3 md:px-8 md:py-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={toggle}
              className="hidden md:flex flex-shrink-0 items-center justify-center rounded-xl p-2.5 bg-theme-track border border-theme text-theme-muted hover:text-green-500 hover:border-green-500/30 transition-all"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            {/* Mobile brand mark */}
            <div className="md:hidden flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/20">
              <span className="text-white text-xs font-black tracking-tight">MF</span>
            </div>
            <h2 className="text-base font-bold truncate md:text-xl text-theme leading-tight">
              {t("appTitle")}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 border-r border-theme pr-4">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <VoiceCommand onCommand={handleVoiceCommand} compact />
          </div>
        </header>

        {showBanner && (
          <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 md:mx-8 md:mt-6 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base">Backend unavailable</p>
              <p className="text-xs text-amber-500/80 mt-1 leading-relaxed">
                {error}
                {(error === "API error 404" || error?.includes("Failed to fetch")) && (
                  <span className="block mt-2">Start: <code className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-mono">python manage.py runserver</code></span>
                )}
              </p>
            </div>
            <button type="button" onClick={() => setDismissed(true)} className="p-1.5 rounded-lg hover:bg-amber-500/20 flex-shrink-0 transition-colors" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Area with optimized mobile padding */}
        <div className="flex-1 p-4 pb-24 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
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
