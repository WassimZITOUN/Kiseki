"use client";

import { AuthProvider } from "@repo/app";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("kiseki-web-theme");
    const theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
