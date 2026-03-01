"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map as MapIcon, Wallet, Menu, BarChart2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useSidebar } from "@/contexts/SidebarContext";

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { toggle, collapsed } = useSidebar();

    // Hide bottom nav on specific pages, like login/landing page if pathname is "/"
    if (pathname === "/") return null;

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
        { href: "/fields", icon: BarChart2, labelKey: "fieldAnalytics" },
        { href: "/map", icon: MapIcon, labelKey: "landMap" },
        { href: "/expenses", icon: Wallet, labelKey: "expensesIncome" },
    ];

    const isActive = (href: string) => {
        if (pathname === href) return true;
        if (href === "/fields" || href === "/map" || href === "/expenses") return pathname.startsWith(href);
        return false;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[40] bg-[var(--card)] border-t border-[var(--border)] backdrop-blur-lg bg-opacity-90 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200 ${active ? "text-green-500" : "text-theme-muted hover:text-theme"
                                }`}
                        >
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 transition-all duration-200 ${active ? "bg-green-500/20" : "bg-transparent"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${active ? "fill-green-500/10" : "opacity-80"}`} />
                            </div>
                            <span className="text-[10px] font-medium tracking-wide truncate w-full text-center">
                                {t(item.labelKey)}
                            </span>
                        </Link>
                    );
                })}
                {/* Menu Toggle */}
                <button
                    onClick={toggle}
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200 ${!collapsed ? "text-green-500" : "text-theme-muted hover:text-theme"
                        }`}
                >
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 transition-all duration-200 ${!collapsed ? "bg-green-500/20" : "bg-transparent"
                            }`}
                    >
                        <Menu className={`w-5 h-5 ${!collapsed ? "" : "opacity-80"}`} />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide">Menu</span>
                </button>
            </div>
        </div>
    );
}
