"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("smartland_token")) {
      router.replace("/");
    }
  }, [router, isLoggedIn]);

  return <>{children}</>;
}
