import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";

/**
 * Every routed page inside this group renders in the global chrome. The role
 * is hard-coded until the session endpoint lands; AppShell takes it as a prop
 * so swapping in the real user is a one-line change here.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="ADMIN">{children}</AppShell>;
}
