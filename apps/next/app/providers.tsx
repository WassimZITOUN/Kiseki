"use client";

import { AuthProvider } from "@repo/app";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
