import { redirect } from "next/navigation";
import { AppShell } from "@/components/common/AppShell";
import { getTenantId } from "@/server/db";

// The tenant check must run on every request: the workspace may not exist
// yet at build time (first-run setup happens after deploy). Static prerender
// would bake in the build-time DB state and never re-check.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // First-run: no company workspace yet — send the admin through setup.
  // (The admin key gate in middleware already ran; this is only reachable authed.)
  const tid = await getTenantId();
  if (!tid) redirect("/setup");
  return <AppShell>{children}</AppShell>;
}
