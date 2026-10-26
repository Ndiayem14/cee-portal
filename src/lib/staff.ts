import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  role: "reviewer" | "admin";
};

/**
 * Use at the top of every staff page and action.
 * Signed out → login. Not staff → null. Staff without 2FA this session → /admin/mfa.
 * The database enforces the same rules (is_staff() requires aal2), so this is a second layer.
 */
export async function requireStaff(next = "/admin"): Promise<StaffContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data: role } = await supabase.rpc("my_role");
  if (role !== "reviewer" && role !== "admin") return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin/mfa");

  return { supabase, userId: user.id, email: user.email ?? null, role };
}

export async function audit(
  ctx: StaffContext,
  action: string,
  applicationId: string | null,
  extra: { documentId?: string; detail?: Record<string, unknown> } = {},
) {
  await ctx.supabase.from("audit_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action,
    application_id: applicationId,
    document_id: extra.documentId ?? null,
    detail: extra.detail ?? null,
  });
}
