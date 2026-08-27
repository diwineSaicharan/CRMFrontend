"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { LiveAccess } from "@/components/auth/LiveAccess";
import { RequireCrmAccess } from "@/components/auth/RequireCrmAccess";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Every routed page inside this group renders in the global chrome, and only
 * for a signed-in user. The role comes from the live session, so the sidebar
 * shows exactly what this account is allowed to see.
 */
function ShellWithSession({ children }: { children: ReactNode }) {
  const { effectiveRole } = useAuth();
  return (
    <AppShell userRole={effectiveRole}>
      {/* Watches for access changes made by an admin elsewhere. Inside the
          shell so it only runs for a signed-in session. */}
      <LiveAccess />
      {/* Inside the shell, so a redirect keeps the chrome rather than blanking
          the screen — and the nav has already hidden what this account lacks. */}
      <RequireCrmAccess>{children}</RequireCrmAccess>
    </AppShell>
  );
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ShellWithSession>{children}</ShellWithSession>
    </RequireAuth>
  );
}
