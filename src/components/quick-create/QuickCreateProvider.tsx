"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type { QuickCreateKind } from "@/lib/deposit-withdrawal";

interface QuickCreateContextValue {
  /** Which form is showing; null when nothing is open. */
  kind: QuickCreateKind | null;
  open: (kind: QuickCreateKind) => void;
  close: () => void;
}

const QuickCreateContext = createContext<QuickCreateContextValue | null>(null);

/** Each quick-create form has its own path, so opening one is linkable. */
const PATH_BY_KIND: Record<QuickCreateKind, string> = {
  user: "/create-user",
  deposit: "/create-deposit",
  withdrawal: "/create-withdrawal",
};

const KIND_BY_PATH = new Map<string, QuickCreateKind>(
  (Object.entries(PATH_BY_KIND) as Array<[QuickCreateKind, string]>).map(
    ([kind, path]) => [path, kind],
  ),
);

/** Where to land when a form is dismissed and there is no page to go back to. */
const FALLBACK_BY_KIND: Record<QuickCreateKind, string> = {
  user: "/clients",
  deposit: "/deposits",
  withdrawal: "/withdrawals",
};

/**
 * Replaces the Angular QuickCreateService/opened$ subject: the right rail
 * publishes a kind, the modal subscribes.
 *
 * Which form is open is read from the URL rather than held in state. That is
 * what makes /create-deposit work on a reload or a shared link, and it also
 * removes a conflict the state version had: the sheet used to be closed by an
 * effect watching for *any* route change — needed so a sidebar link could not
 * load a page behind a form still covering it — which meant a form could not
 * have a URL of its own without instantly closing itself. Derived from the
 * path, navigating away stops matching and the sheet closes on its own.
 */
export function QuickCreateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const kind = KIND_BY_PATH.get(pathname) ?? null;

  // Where the form was opened from, so dismissing it goes back there rather
  // than to a generic page. Empty on a direct load of a /create-* URL.
  const openedFrom = useRef<string | null>(null);

  const open = useCallback((next: QuickCreateKind) => {
    // pushState, not a route push: the page underneath must stay as it is, and
    // this is the same document either way.
    openedFrom.current = window.location.pathname + window.location.search;
    window.history.pushState(null, "", PATH_BY_KIND[next]);
  }, []);

  const close = useCallback(() => {
    const current = KIND_BY_PATH.get(window.location.pathname);
    if (!current) return;

    if (openedFrom.current !== null) {
      // Opening pushed an entry, so dismissing pops it. Pushing the previous
      // path instead would leave the form in history, and Back would reopen it.
      openedFrom.current = null;
      window.history.back();
      return;
    }

    // Landed straight on a /create-* URL, so there is nothing to go back to.
    window.history.replaceState(null, "", FALLBACK_BY_KIND[current]);
  }, []);

  const value = useMemo(() => ({ kind, open, close }), [kind, open, close]);

  return (
    <QuickCreateContext.Provider value={value}>{children}</QuickCreateContext.Provider>
  );
}

export function useQuickCreate() {
  const context = useContext(QuickCreateContext);
  if (!context) {
    throw new Error("useQuickCreate must be used inside <QuickCreateProvider>");
  }
  return context;
}
