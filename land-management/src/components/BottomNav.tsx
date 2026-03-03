"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Package, Map as MapIcon, MoreHorizontal } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard", fallback: "Home" },
    { href: "/activities", icon: BookOpen, labelKey: "activities", fallback: "Farm" },
    { href: "/materials", icon: Package, labelKey: "materials", fallback: "Stock" },
    { href: "/map", icon: MapIcon, labelKey: "landMap", fallback: "Map" },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLocale();
    const { toggle, collapsed } = useSidebar();

    if (pathname === "/") return null;

    const isActive = (href: string) =>
        pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[40]">
            <div className="flex items-center justify-around bg-theme-card/90 backdrop-blur-2xl border border-theme shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-2 px-3 pb-safe-offset">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.fallback;
                    // Provide a cleaner string truncation
                    const short = label.length > 7 ? label.slice(0, 6) + "…" : label;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl relative transition-all duration-300 ${active ? "bg-green-500/15" : "hover:bg-theme-track"
                                }`}
                            aria-label={label}
                        >
                            <item.icon
                                className={`w-[22px] h-[22px] transition-colors duration-300 ${active ? "text-green-500" : "text-theme-muted"}`}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span
                                className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${active ? "text-green-500" : "text-theme-muted"}`}
                            >
                                {short}
                            </span>
                        </Link>
                    );
                })}

                <button
                    onClick={toggle}
                    className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl relative transition-all duration-300 ${!collapsed ? "bg-green-500/15" : "hover:bg-theme-track"
                        }`}
                    aria-label="More Options"
                >
                    <MoreHorizontal
                        className={`w-[22px] h-[22px] transition-colors duration-300 ${!collapsed ? "text-green-500" : "text-theme-muted"}`}
                        strokeWidth={!collapsed ? 2.5 : 2}
                    />
                    <span
                        className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${!collapsed ? "text-green-500" : "text-theme-muted"}`}
                    >
                        More
                    </span>
                </button>
            </div>
        </div>
    );
}
