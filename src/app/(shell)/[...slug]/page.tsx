import { notFound, redirect } from "next/navigation";

import { ClientsPage } from "@/components/clients/ClientsPage";
import { CreatePage } from "@/components/create/CreatePage";
import { CREATE_LABELS, type CreateEntityKey } from "@/components/create/create-nav.config";
import { CompletedTransactionsPage } from "@/components/transactions/CompletedTransactionsPage";
import { TeammatesPage } from "@/components/teammates/TeammatesPage";
import { WorkingDwPage } from "@/components/working-dw/WorkingDwPage";

/**
 * Every page inside the shell, behind one optional catch-all.
 *
 * This replaces the per-route files that Next's file-system routing would
 * normally give us, so a few things are now this switch's job rather than the
 * framework's: an unknown path is notFound() here instead of simply not
 * existing, and none of these routes can prerender any more, because the
 * segment is not known at build time.
 *
 * Only /clients and /create actually vary by segment — a client id and a create
 * type. The other three are fixed pages folded in to keep the routing in one
 * place, which is what was asked for.
 *
 * Required rather than optional: an optional catch-all also matches "/", which
 * collides with app/page.tsx, and Next refuses to build with both. "/" keeps
 * its redirect to /clients.
 */
export default async function ShellRoute({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const [section, ...rest] = slug;

  switch (section) {
    case "clients":
      // rest[0] is the selected client id. ClientDirectory reads it off the
      // pathname rather than from here, because an in-app click updates the
      // URL with history.pushState instead of routing.
      return <ClientsPage entity="users" />;

    case "create": {
      const type = rest[0] ?? "user";
      if (!(type in CREATE_LABELS)) notFound();
      return <CreatePage entity={type as CreateEntityKey} />;
    }

    case "deposits":
      return <WorkingDwPage tab="deposit" />;

    case "withdrawals":
      return <WorkingDwPage tab="withdrawal" />;

    case "transactions":
      return <CompletedTransactionsPage />;

    case "teammates":
      return <TeammatesPage />;

    // The quick-create forms. QuickCreateProvider reads the path and shows the
    // sheet; these render what sits behind it, so a reload or a shared link
    // lands on a real page with the form open rather than on a 404.
    case "create-deposit":
      return <WorkingDwPage tab="deposit" />;

    case "create-withdrawal":
      return <WorkingDwPage tab="withdrawal" />;

    case "create-user":
      return <ClientsPage entity="users" />;

    // The combined page that was split into /deposits and /withdrawals.
    case "working-deposit-withdrawal":
      redirect("/deposits");

    default:
      notFound();
  }
}
