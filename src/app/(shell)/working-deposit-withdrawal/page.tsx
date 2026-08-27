import { redirect } from "next/navigation";

/** The combined page split into /deposits and /withdrawals. */
export default function WorkingDepositWithdrawalRoute() {
  redirect("/deposits");
}
