import { CreatePage } from "@/components/create/CreatePage";

/**
 * Create. Static, not `[type]`: the CRM creates a root platform user and
 * nothing else — DL, Super, Master, TeamMate and Platform live in diwine_admin.
 */
export default function CreateRoute() {
  return <CreatePage entity="user" />;
}
