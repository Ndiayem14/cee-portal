"use server";

import { revalidatePath } from "next/cache";
import { audit, requireStaff } from "@/lib/staff";
import { sendEmail, siteUrl } from "@/lib/notify";
import type { ApplicationStatus } from "@/lib/types";

async function staffOrThrow(appId: string) {
  const ctx = await requireStaff(`/admin/applications/${appId}`);
  if (!ctx) throw new Error("Staff access required");
  return ctx;
}

async function setStatus(appId: string, status: ApplicationStatus, extra: Record<string, unknown> = {}) {
  const ctx = await staffOrThrow(appId);
  const { data, error } = await ctx.supabase
    .from("applications")
    .update({ status, ...extra })
    .eq("id", appId)
    .select("id, email, first_name, status")
    .single();
  if (error) throw new Error("Couldn't update the application");
  await audit(ctx, "status_change", appId, { detail: { status, ...extra } });
  return { ctx, app: data };
}

export async function markUnderReview(formData: FormData) {
  const id = String(formData.get("id"));
  await setStatus(id, "under_review");
  revalidatePath(`/admin/applications/${id}`);
}

export async function requestInfo(formData: FormData) {
  const id = String(formData.get("id"));
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const ctx = await staffOrThrow(id);
  const { error } = await ctx.supabase
    .from("info_requests")
    .insert({ application_id: id, message, created_by: ctx.userId });
  if (error) throw new Error("Couldn't save the request");

  const { app } = await setStatus(id, "needs_info");
  await audit(ctx, "request_info", id);
  await sendEmail({
    to: app.email,
    subject: "We need a bit more for your Community Equity Endowment application",
    text: `Hi ${app.first_name ?? "there"},\n\nThanks for applying. To finish reviewing your application we need a little more information:\n\n${message}\n\nSign in to update your application: ${siteUrl(
      "/my-application",
    )}\n\nPlease don't reply with documents by email; upload them in the application.\n\nThe CEE team`,
  });
  revalidatePath(`/admin/applications/${id}`);
}

export async function decide(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (decision !== "approved" && decision !== "denied") return;
  if (decision === "denied" && !reason) throw new Error("A reason is required when an application isn't eligible");

  const { app } = await setStatus(id, decision, { decision_reason: reason });
  await sendEmail({
    to: app.email,
    subject: "An update on your Community Equity Endowment application",
    text: `Hi ${app.first_name ?? "there"},\n\nWe've finished reviewing your application. Sign in to see the decision: ${siteUrl(
      "/my-application",
    )}\n\nThe CEE team`,
  });
  revalidatePath(`/admin/applications/${id}`);
}

export async function addNote(formData: FormData) {
  const id = String(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const ctx = await staffOrThrow(id);
  await ctx.supabase.from("review_notes").insert({ application_id: id, author_id: ctx.userId, author_email: ctx.email, body });
  revalidatePath(`/admin/applications/${id}`);
}
