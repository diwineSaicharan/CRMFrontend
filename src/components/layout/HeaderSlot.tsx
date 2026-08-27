"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Lets a page put its own toolbar on the shell's header row.
 *
 * The Deposit / Withdrawal switch is global chrome, so it lives in AppShell's
 * header. A page's toolbar lives in the page. Without a slot those are two
 * stacked rows — which is what pushed the Clients search bar onto a second
 * line under the switch, wasting a band of vertical space on every screen.
 *
 * AppShell hands out the header's left-hand element; a page renders into it
 * with <HeaderSlot>. Pages that have no toolbar simply do not use it, and the
 * switch keeps the row to itself.
 */

const HeaderSlotContext = createContext<HTMLElement | null>(null);

export function HeaderSlotProvider({
  children,
}: {
  children: (setSlot: (node: HTMLElement | null) => void) => ReactNode;
}) {
  // State, not a ref: the portal has to render once the element exists, and a
  // ref mutation would not schedule that.
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <HeaderSlotContext.Provider value={slot}>
      {children(setSlot)}
    </HeaderSlotContext.Provider>
  );
}

export function HeaderSlot({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  // First render on the client has no element yet; the portal appears on the
  // commit right after, so nothing flashes in the wrong place.
  if (!slot) return null;
  return createPortal(children, slot);
}
