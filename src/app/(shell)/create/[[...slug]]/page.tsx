import { notFound } from "next/navigation";

import { CreatePage } from "@/components/create/CreatePage";
import { CREATE_LABELS, type CreateEntityKey } from "@/components/create/create-nav.config";

/**
 * Create, at /create and /create/<type>.
 *
 * The type is in the URL so a form is linkable and survives a reload, the same
 * way a selected client is. Only "user" exists today; an unknown type is a 404
 * rather than a silent fallback, so a bad link says so.
 */
export default async function CreateRoute({
  params,
}: PageProps<"/create/[[...slug]]">) {
  const { slug } = await params;
  const type = slug?.[0] ?? "user";

  if (!(type in CREATE_LABELS)) notFound();

  return <CreatePage entity={type as CreateEntityKey} />;
}
