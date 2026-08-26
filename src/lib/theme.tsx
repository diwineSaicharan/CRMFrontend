"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "crm-theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The `.dark` class on <html> is the single source of truth — `themeInitScript`
 * puts it there before first paint, so there is no state to initialise in an
 * effect and no flash to hide.
 */
function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The preference is a convenience; private-mode browsers throw here.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Kept as a component so the shell has one obvious place to hang future
 * theme concerns, even though the store itself is module-level.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);
  const toggleTheme = useCallback(
    () => applyTheme(getSnapshot() === "dark" ? "light" : "dark"),
    [],
  );

  return { theme, isDark: theme === "dark", setTheme, toggleTheme };
}

/** Applies the stored theme before first paint so dark mode never flashes. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;
