"use client";

import { LocaleProvider } from "@/contexts/LocaleContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
