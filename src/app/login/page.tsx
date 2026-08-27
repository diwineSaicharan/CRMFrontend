import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — StakeBazzaar CRM",
};

export default function LoginRoute() {
  return <LoginForm />;
}
