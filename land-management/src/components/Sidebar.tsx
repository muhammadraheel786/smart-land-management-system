"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Wallet,
  Droplets,
  FileText,
  MessageCircle,
  Mic,
  BarChart3,
  Satellite,
  Brain,
  LogIn,
  LogOut,
  Thermometer,
  TrendingUp,
  BarChart2,
  Download,
  BookOpen,
  Package,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/data-bank", icon: BookOpen, labelKey: "dataBank" },
  { href: "/materials", icon: Package, labelKey: "materials" },
  { href: "/field-recommendations", icon: Lightbulb, labelKey: "fieldRecommendations" },
  { href: "/map", icon: Map, labelKey: "landMap" },
  { href: "/expenses", icon: Wallet, labelKey: "expensesIncome" },
  { href: "/thaka", icon: FileText, labelKey: "thakaManagement" },
  { href: "/water", icon: Droplets, labelKey: "waterManagement" },
  { href: "/temperature", icon: Thermometer, labelKey: "temperatureManagement" },
  { href: "/statistics", icon: BarChart3, labelKey: "statistics" },
  { href: "/fields", icon: BarChart2, labelKey: "fieldAnalytics" },
  { href: "/predictions", icon: TrendingUp, labelKey: "predictions" },
  { href: "/satellite", icon: Satellite, labelKey: "satelliteMonitor" },
  { href: "/ai", icon: Brain, labelKey: "aiInsights" },
  { href: "/chatbot", icon: MessageCircle, labelKey: "aiChatbot" },
  { href: "/voice", icon: Mic, labelKey: "voiceCommands" },
  { href: "/export", icon: Download, labelKey: "exportData" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { collapsed, toggle } = useSidebar();
  const { isLoggedIn, logout } = useAuth();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/fields" || href === "/data-bank" || href === "/materials" || href === "/field-recommendations") return false;
    return pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-[50] glass-panel bg-theme/40 md:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[60] flex h-screen flex-col border-r border-border bg-theme-card shadow-2xl md:shadow-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed
            ? "-translate-x-full md:w-[80px] md:translate-x-0"
            : "w-[280px] translate-x-0"
          }`}
      >
        {/* Header */}
        <div className={`flex shrink-0 items-center justify-between border-b border-theme p-4 transition-all ${collapsed ? "md:justify-center md:flex-col md:gap-3" : ""}`}>
          <Link href="/dashboard" className={`flex min-w-0 items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20">
              <Map className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-fade-in">
                <span className="truncate font-bold text-theme block text-lg">Mashori Farm</span>
                <p className="truncate text-xs text-theme-muted font-medium">Smart Land System</p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {!collapsed && (
            <button
              onClick={toggle}
              className="md:hidden p-2 rounded-xl bg-theme-track text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggle}
            className={`hidden md:flex items-center justify-center rounded-xl p-2.5 text-theme-muted hover:bg-theme-track hover:text-green-500 transition-colors ${collapsed ? "w-full" : ""}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Scrollable nav list */}
        <nav className="sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
          <ul className="space-y-1.5 pb-20 md:pb-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${collapsed ? "md:justify-center md:px-0" : ""
                      } ${active
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 text-green-500 font-semibold shadow-sm"
                        : "text-theme-muted hover:bg-theme-track hover:text-theme"
                      }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110 group-hover:text-green-500"}`} />
                    {!collapsed && <span className="truncate tracking-wide">{t(item.labelKey)}</span>}
                  </Link>
                  {/* Tooltip for collapsed desktop view */}
                  {collapsed && (
                    <div className="absolute left-[85px] top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center pointer-events-none z-[100] animate-fade-in">
                      <div className="bg-theme text-white border border-border px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-xl">
                        {t(item.labelKey)}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-theme p-4 flex flex-col gap-2">
          {collapsed ? (
            <button
              type="button"
              onClick={toggle}
              className="hidden md:flex w-full items-center justify-center rounded-xl p-3 text-theme-muted hover:bg-theme-track hover:text-green-500 transition-colors group"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="truncate font-semibold tracking-wide">{t("logout")}</span>
            </button>
          ) : (
            <Link
              href="/"
              className="flex w-full items-center gap-3.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200"
            >
              <LogIn className="h-5 w-5 shrink-0" />
              <span className="truncate font-semibold tracking-wide">{t("login")}</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

