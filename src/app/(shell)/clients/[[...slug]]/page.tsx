import { ClientsPage } from "@/components/clients/ClientsPage";

/**
 * The clients directory, at /clients and at /clients/<anything>.
 *
 * An optional catch-all, so one file serves the bare list and a selected
 * client. The segments are not read here: selection is taken from the pathname
 * inside ClientDirectory, because an in-app click updates the URL with
 * history.pushState rather than routing, and both paths have to agree.
 */
export default function ClientsRoute() {
  return <ClientsPage entity="users" />;
}
