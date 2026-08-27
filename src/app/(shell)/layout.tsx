"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Every routed page inside this group renders in the global chrome, and only
 * for a signed-in user. The role comes from the live session, so the sidebar
 * shows exactly what this account is allowed to see.
 */
function ShellWithSession({ children }: { children: ReactNode }) {
  const { effectiveRole } = useAuth();
  return <AppShell userRole={effectiveRole}>{children}</AppShell>;
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ShellWithSession>{children}</ShellWithSession>
    </RequireAuth>
  );
}
