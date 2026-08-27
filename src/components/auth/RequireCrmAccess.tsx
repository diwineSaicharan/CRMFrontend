"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";
import { CRM_CAPABILITIES, type CrmCapability } from "@/lib/auth";

/**
 * Keeps a teammate out of pages they were not granted.
 *
 * Hiding a sidebar row stops the obvious route in; this stops a typed URL, a
 * bookmark, or a link someone pasted them. It is a convenience, not the
 * control — the endpoints refuse them regardless, so the worst case without
 * this is a page that loads and then cannot fetch anything.
 *
 * Rather than showing "no access", it sends them to the first page they *can*
 * use. A teammate with only deposit access landing on / should end up looking
 * at deposits, not at a wall.
 */

/** Which capability each path needs. Keep in step with nav-config. */
const CAPABILITY_BY_PREFIX: Array<[string, CrmCapability]> = [
  ["/clients", "clients"],
  ["/create-user", "create"],
  ["/create", "create"],
  ["/create-deposit", "deposit"],
  ["/deposits", "deposit"],
  ["/create-withdrawal", "withdrawal"],
  ["/withdrawals", "withdrawal"],
  ["/transactions", "transaction"],
];

/** Where each capability's holder should land. */
const HOME_BY_CAPABILITY: Record<CrmCapability, string> = {
  clients: "/clients",
  create: "/create",
  deposit: "/deposits",
  withdrawal: "/withdrawals",
  transaction: "/transactions",
};

function requiredFor(pathname: string): CrmCapability | null {
  const match = CAPABILITY_BY_PREFIX.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  return match ? match[1] : null;
}

export function RequireCrmAccess({ children }: { children: ReactNode }) {
  const { permissions, permissionsKnown } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const needed = requiredFor(pathname);
  // Nothing is denied until the access is actually known — otherwise a
  // teammate meets the no-access screen before their permissions have loaded.
  const denied = permissionsKnown && !!needed && !permissions[needed];

  // The first page this account can actually use, in sidebar order.
  const fallback = CRM_CAPABILITIES.find((capability) => permissions[capability]);

  useEffect(() => {
    // Only redirect when there is somewhere to go. This used to send accounts
    // with no access at all to "/no-access", which is not a route — so they
    // landed on a 404 the moment they signed in, which reads as a broken app
    // rather than as missing permissions.
    if (denied && fallback) router.replace(HOME_BY_CAPABILITY[fallback]);
  }, [denied, fallback, router]);

  if (!permissionsKnown) {
    return (
      <div
        className="fixed inset-0 grid place-items-center text-sm text-[#6A95B9]"
        role="status"
        aria-live="polite"
      >
        Checking your access…
      </div>
    );
  }

  if (denied && fallback) {
    return (
      <div
        className="fixed inset-0 grid place-items-center text-sm text-[#6A95B9]"
        role="status"
        aria-live="polite"
      >
        Taking you to your dashboard…
      </div>
    );
  }

  // Nothing granted: say so, in place, rather than bouncing them anywhere.
  if (denied || !fallback) {
    return <NoAccess />;
  }

  return <>{children}</>;
}

/**
 * What an account with no CRM access sees.
 *
 * Deliberately explicit about what to do next: the person hitting this cannot
 * fix it themselves, and every alternative — a 404, an empty shell, a redirect
 * loop — leaves them guessing whether the app is broken.
 */
function NoAccess() {
  const { user, logout } = useAuth();

  return (
    <div className="grid min-h-0 flex-1 place-items-center p-6">
      <div className="max-w-[440px] rounded-xl border border-[#9DBFBE] bg-white/60 p-6 text-center dark:border-[#0062AD] dark:bg-[#0091ff0d]">
        <span className="material-icons text-[34px] text-[#6a95b9] dark:text-[#9ED4FF]">
          lock_person
        </span>
        <h1 className="mt-2 mb-1 text-lg font-semibold text-[#214055] dark:text-[#D8EEFF]">
          No access yet
        </h1>
        <p className="m-0 text-[13px] text-[#6a95b9] dark:text-[#9ED4FF]/80">
          {user?.username ? <strong>{user.username}</strong> : "This account"} can sign in,
          but has not been granted any part of the CRM. An admin can grant it under
          TeamMates.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 cursor-pointer rounded-md border border-[#9DBFBE] px-3.5 py-1.5 text-[13px] text-[#214055] dark:border-[#0062AD] dark:text-[#BDE1FF]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
