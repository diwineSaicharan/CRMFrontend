import { ClientsPage } from "@/components/clients/ClientsPage";

/**
 * A client selected by id. The directory renders exactly as it does at
 * /clients, with this row picked — so a selection is linkable, survives a
 * reload, and the back button walks through the clients you looked at.
 *
 * This segment is a real id, unlike the `[type]` it replaced, which guarded a
 * single valid value.
 */
export default async function ClientRoute({ params }: PageProps<"/clients/[userId]">) {
  const { userId } = await params;
  return <ClientsPage entity="users" selectedId={decodeURIComponent(userId)} />;
}
