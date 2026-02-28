"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[#161b22] border border-[#30363d]">
      <button
        onClick={() => setLocale("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
          locale === "en" ? "bg-green-500 text-white" : "text-[#8b949e] hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ur")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
          locale === "ur" ? "bg-green-500 text-white" : "text-[#8b949e] hover:text-white"
        }`}
      >
        اردو
      </button>
    </div>
  );
}
