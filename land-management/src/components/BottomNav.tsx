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
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[40]"
            style={{
                background: "var(--card)",
                borderTop: "1px solid var(--border)",
                boxShadow: "0 -2px 16px rgba(0,0,0,0.12)",
                paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
            }}
        >
            <div className="flex items-stretch justify-around">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.fallback;
                    const short = label.length > 7 ? label.slice(0, 6) + "…" : label;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0 relative"
                            aria-label={label}
                        >
                            {active && (
                                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-7 rounded-xl bg-green-500/15 -z-0 pointer-events-none" />
                            )}
                            <item.icon
                                className={`w-[19px] h-[19px] relative z-10 transition-all duration-200 ${active ? "text-green-500" : "text-[var(--muted)]"}`}
                                strokeWidth={active ? 2.3 : 1.75}
                            />
                            <span
                                className={`text-[9.5px] font-semibold leading-none relative z-10 transition-colors duration-200 ${active ? "text-green-500" : "text-[var(--muted)]"}`}
                            >
                                {short}
                            </span>
                        </Link>
                    );
                })}

                {/* More / Sidebar toggle */}
                <button
                    onClick={toggle}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-0 relative"
                    aria-label="More"
                >
                    {!collapsed && (
                        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-7 rounded-xl bg-green-500/15 -z-0 pointer-events-none" />
                    )}
                    <MoreHorizontal
                        className={`w-[19px] h-[19px] relative z-10 transition-all duration-200 ${!collapsed ? "text-green-500" : "text-[var(--muted)]"}`}
                        strokeWidth={!collapsed ? 2.3 : 1.75}
                    />
                    <span
                        className={`text-[9.5px] font-semibold leading-none relative z-10 transition-colors duration-200 ${!collapsed ? "text-green-500" : "text-[var(--muted)]"}`}
                    >
                        More
                    </span>
                </button>
            </div>
        </div>
    );
}
