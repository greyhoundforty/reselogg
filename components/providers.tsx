"use client";

import { AuthProvider } from "@/components/auth-provider";
import { HikesProvider } from "@/components/hikes-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <HikesProvider>{children}</HikesProvider>
    </AuthProvider>
  );
}
