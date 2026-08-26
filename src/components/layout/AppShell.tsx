"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { QuickCreateModal } from "@/components/quick-create/QuickCreateModal";
import { QuickCreateProvider } from "@/components/quick-create/QuickCreateProvider";
import { RightRail } from "./RightRail";
import { Sidebar } from "./Sidebar";
import { sidebarModeForPath, type UserRole } from "@/lib/nav-config";

export interface AppShellProps {
  children: ReactNode;
  userRole?: UserRole | null;
}

/**
 * Global chrome: fixed left sidebar, fixed right action rail, and a scrolling
 * workspace between them — the arrangement of AdminComponent's
 * .background-container / .main-content in diwine_admin_ui.
 *
 * Whether the sidebar starts collapsed is a property of the route, exactly as
 * the Angular app has it (`.main-content.clients-section-active` pulls the
 * margin in to the rail width); see `sidebarModeForPath`.
 */
export function AppShell({ children, userRole = "ADMIN" }: AppShellProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const isRail = sidebarModeForPath(pathname) === "rail";
  const minimized = isRail && !hovered;

  // The workspace is offset by the route's *base* width, never the hovered
  // one, so expanding the rail floats over the page instead of shoving it
  // sideways — `.main-content.<section>-active.sidebar-menu-open` keeps the
  // minimized margin for exactly this reason.
  const workspaceOffset = isRail
    ? "var(--shell-sidebar-minimized-width)"
    : "var(--shell-sidebar-width)";

  return (
    <QuickCreateProvider>
      <div className="shell-backdrop fixed inset-0 flex h-screen w-screen items-start justify-start overflow-hidden transition-all duration-300">
        <Sidebar
          isMinimized={minimized}
          isRail={isRail}
          userRole={userRole}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />

        {/* The sidebar is fixed, so the workspace is offset by margin rather
            than laid out beside it — that keeps the hover expansion from
            reflowing the page underneath. */}
        {/* `overflow-hidden`, as `.main-content.<section>-active` has it: each
            page owns its own scrolling panes so the columns scroll rather than
            the workspace. */}
        <main
          className="flex h-[var(--shell-content-height)] min-w-0 flex-1 flex-col overflow-hidden pt-[var(--shell-content-top-padding)] pr-[var(--shell-rail-width)] pb-[var(--shell-content-bottom-padding)]"
          style={{ marginLeft: workspaceOffset }}
        >
          {children}
        </main>

        <RightRail />
        <QuickCreateModal />
      </div>
    </QuickCreateProvider>
  );
}
