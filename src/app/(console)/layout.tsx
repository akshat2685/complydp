import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/common/AppShell";
import { getTenantId } from "@/server/db";
import { ADMIN_COOKIE, validateSessionToken } from "@/server/session";

// The tenant check must run on every request: the workspace may not exist
// yet at build time (first-run setup happens after deploy). Static prerender
// would bake in the build-time DB state and never re-check.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // Authoritative session check for console pages. The middleware only checks
  // that a well-formed token is PRESENT (it runs on the Edge runtime and
  // can't reach the DB on Next 15.1); validity — SHA-256 + timing-safe
  // compare against the sessions table — is enforced here, in Node.
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await validateSessionToken(token))) redirect("/login");
  // First-run: no company workspace yet — send the admin through setup.
  const tid = await getTenantId();
  if (!tid) redirect("/setup");
  return <AppShell>{children}</AppShell>;
}
