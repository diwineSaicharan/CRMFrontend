import { ClientsPage } from "@/components/clients/ClientsPage";

/**
 * The clients directory. Static, not `[type]`: the CRM lists end users and
 * nothing else, so there was one valid segment behind a runtime check that
 * rejected or redirected everything else.
 */
export default function ClientsRoute() {
  return <ClientsPage entity="users" />;
}
