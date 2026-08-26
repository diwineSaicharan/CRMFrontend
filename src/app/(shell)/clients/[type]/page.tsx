import { notFound, redirect } from "next/navigation";

import { ClientsPage } from "@/components/clients/ClientsPage";
import { CLIENT_DIRECTORY_CONFIGS } from "@/components/clients/client-directory.config";
import type { ClientEntityKey } from "@/lib/clients";

export default async function ClientsRoute({ params }: PageProps<"/clients/[type]">) {
  const { type } = await params;

  if (!(type in CLIENT_DIRECTORY_CONFIGS)) notFound();

  // Only the end-user directory is navigable; the upstream rungs keep their
  // config but redirect here rather than rendering a list the nav cannot reach.
  if (type !== "users") redirect("/clients/users");

  return <ClientsPage entity={type as ClientEntityKey} />;
}
