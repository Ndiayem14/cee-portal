"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/notify";

/** Submits (or re-submits) the signed-in applicant's application. The database trigger enforces the rules. */
export async function submitApplication(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session ended. Sign in again to submit." };

  const { data: app, error } = await supabase
    .from("applications")
    .update({ status: "submitted" })
    .eq("user_id", user.id)
    .in("status", ["draft", "needs_info"])
    .select("id, email, first_name")
    .single();

  if (error || !app) {
    return { ok: false, error: "We couldn't submit your application. Check that every step is complete and try again." };
  }

  await sendEmail({
    to: app.email,
    subject: "We received your Community Equity Endowment application",
    text: `Hi ${app.first_name ?? "there"},\n\nThanks for applying. Your confirmation number is ${app.id
      .slice(0, 8)
      .toUpperCase()}.\n\nWe review every application by hand. You can check your status any time at ${siteUrl(
      "/my-application",
    )}.\n\nThe CEE team`,
  });

  return { ok: true };
}
