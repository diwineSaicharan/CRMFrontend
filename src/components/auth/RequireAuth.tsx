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
    // One placeholder for both states: rendering the shell before the profile
    // resolves would flash a signed-in layout at someone who is signed out.
    return (
      <div
        className="fixed inset-0 grid place-items-center text-sm text-[#6A95B9]"
        role="status"
        aria-live="polite"
      >
        {status === "loading" ? "Checking your session…" : "Redirecting to sign in…"}
      </div>
    );
  }

  return <>{children}</>;
}
