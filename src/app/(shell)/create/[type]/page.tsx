import { notFound } from "next/navigation";

import { CreatePage } from "@/components/create/CreatePage";
import {
  CREATE_LABELS,
  type CreateEntityKey,
} from "@/components/create/create-nav.config";

export default async function CreateRoute({ params }: PageProps<"/create/[type]">) {
  const { type } = await params;

  if (!(type in CREATE_LABELS)) notFound();

  return <CreatePage entity={type as CreateEntityKey} />;
}
