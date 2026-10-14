import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, validateSessionToken } from "@/server/session";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

/**
 * Server gate for the first-run setup wizard. The middleware only checks
 * that a well-formed session token is PRESENT (Edge runtime can't reach the
 * DB on Next 15.1); validity is enforced here before the form renders.
 */
export default async function SetupPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await validateSessionToken(token))) redirect("/login");
  return <SetupForm />;
}
