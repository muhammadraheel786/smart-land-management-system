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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-theme bg-theme-card transition-all duration-300 ease-in-out ${collapsed
            ? "w-0 -translate-x-full md:w-[72px] md:translate-x-0"
            : "w-64 translate-x-0"
          }`}
      >
        {/* Header with logo and collapse toggle */}
        <div className={`flex shrink-0 items-center border-b border-theme p-3 ${collapsed ? "flex-col gap-2 md:flex" : "justify-between"}`}>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Map className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate font-bold text-theme">Smart Land</h1>
                <p className="truncate text-xs text-theme-muted">Farm Management</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={toggle}
            className={`rounded-lg p-2 text-theme-muted hover:bg-theme-track hover:text-theme transition-colors ${collapsed ? "hidden md:flex md:w-full md:justify-center" : "flex"}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Scrollable nav - flex-1 min-h-0 allows overflow */}
        <nav className="sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 pl-3 pr-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${collapsed ? "justify-center px-0" : ""
                      } ${active
                        ? "bg-green-500/20 nav-active border border-green-500/30 font-semibold"
                        : "text-theme-muted hover:bg-theme-track hover:text-theme"
                      }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: expand when collapsed; when expanded show Logout if logged in else Login link */}
        <div className="shrink-0 border-t border-theme p-3">
          {collapsed ? (
            <button
              type="button"
              onClick={toggle}
              className="hidden w-full justify-center rounded-xl p-2.5 text-theme-muted hover:bg-theme-track hover:text-theme md:flex"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-theme-muted hover:bg-theme-track hover:text-theme"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="truncate font-medium">{t("logout")}</span>
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-theme-muted hover:bg-theme-track hover:text-theme"
            >
              <LogIn className="h-5 w-5 shrink-0" />
              <span className="truncate font-medium">{t("login")}</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

