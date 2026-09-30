"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { state: authState, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M3 19h18L14.5 6.5 11 12 8.5 9 3 19Z" />
            </svg>
          </span>
          <span>
            <span className="block font-heading text-sm font-semibold leading-none">
              Mountain-Tracker
            </span>
            <span className="mt-1 block text-[11px] tracking-wide text-muted-foreground uppercase">
              NC family hiking log
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {authState === "authenticated" ? (
            <Button size="sm" variant="outline" onClick={() => void logout()}>
              Sign out
            </Button>
          ) : authState === "unauthenticated" ? (
            <Button size="sm" variant="outline" onClick={() => setShowLogin(true)}>
              Sign in
            </Button>
          ) : null}
        </div>
      </div>
      {showLogin ? (
        <LoginDialog onClose={() => setShowLogin(false)} />
      ) : null}
    </header>
  );
}
