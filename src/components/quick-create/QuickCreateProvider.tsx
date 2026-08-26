"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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

/**
 * Replaces the Angular QuickCreateService/opened$ subject: the right rail
 * publishes a kind, the modal subscribes.
 */
export function QuickCreateProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<QuickCreateKind | null>(null);

  const open = useCallback((next: QuickCreateKind) => setKind(next), []);
  const close = useCallback(() => setKind(null), []);

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
