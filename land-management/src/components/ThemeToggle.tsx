"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  const setAndApplyTheme = (value: Theme) => {
    setTheme(value);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = value;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", value);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme") as Theme | null;
    const preferred: Theme =
      stored ??
      (window.matchMedia?.("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setAndApplyTheme(preferred);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex rounded-full p-0.5 border border-theme bg-theme-card shadow-sm">
        <div className="h-8 w-16 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="flex rounded-full p-0.5 border border-theme bg-theme-card shadow-sm"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setAndApplyTheme("light")}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        style={{
          background: theme === "light" ? "var(--primary)" : "transparent",
          color: theme === "light" ? "#fff" : "var(--foreground)",
        }}
        aria-label="Light mode"
        title="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setAndApplyTheme("dark")}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        style={{
          background: theme === "dark" ? "var(--primary)" : "transparent",
          color: theme === "dark" ? "#fff" : "var(--foreground)",
        }}
        aria-label="Dark mode"
        title="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
