"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";

/**
 * Port of core/guards/auth.guard.ts. Like the Angular guard this is a routing
 * convenience, not a security boundary — the cookie is validated server-side
 * on every request, so a user who forces their way past this still sees 401s.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    // One placeholder for both states, and it must render identical markup for
    // both. "loading" vs "unauthenticated" is decided by a localStorage flag
    // the server cannot read, so the server says unauthenticated while a
    // signed-in browser says loading. Two different strings here made that
    // difference visible to React as a hydration mismatch on every load;
    // rendering the shell before the profile resolves would also flash a
    // signed-in layout at someone who is signed out.
    return (
      <div
        className="fixed inset-0 grid place-items-center text-sm text-[#6A95B9]"
        role="status"
        aria-live="polite"
      >
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
