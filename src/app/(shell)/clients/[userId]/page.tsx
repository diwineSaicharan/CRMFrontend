import { ClientsPage } from "@/components/clients/ClientsPage";

/**
 * A client selected by id — for a direct load, a reload, or a shared link.
 *
 * Clicking a row inside the app does not route here: it updates the URL with
 * history.pushState so the directory is not torn down and refetched just to
 * move the highlight. The directory reads the selection off the pathname
 * either way, so both paths land on the same state.
 */
export default function ClientRoute() {
  return <ClientsPage entity="users" />;
}
