import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";
import { Callout } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import type { Application, ApplicationStatus, InfoRequest } from "@/lib/types";
import { PROGRAM } from "@/config/program";

export const metadata: Metadata = { title: "My application" };

const TRACK: { key: ApplicationStatus[]; label: string }[] = [
  { key: ["submitted"], label: "Submitted" },
  { key: ["under_review", "needs_info"], label: "Under review" },
  { key: ["approved", "denied"], label: "Decision" },
];

function trackIndex(s: ApplicationStatus) {
  return TRACK.findIndex((t) => t.key.includes(s));
}

async function MyApplication({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-application");

  const { submitted } = await searchParams;
  const { data } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle();
  const app = data as Application | null;

  if (!app) {
    return (
      <div className="space-y-4">
        <p className="text-lg">You haven&rsquo;t started an application yet.</p>
        <Link href="/apply" className="btn btn-primary">
          Start your application
        </Link>
      </div>
    );
  }

  const { data: reqData } = await supabase
    .from("info_requests")
    .select("*")
    .eq("application_id", app.id)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });
  const requests = (reqData ?? []) as InfoRequest[];
  const current = trackIndex(app.status);

  return (
    <div className="space-y-8">
      {submitted && app.status === "submitted" && (
        <Callout tone="info" title="Thank you. Your application is in.">
          We review every application by hand. We&rsquo;ll contact you by {app.preferred_contact === "email" ? "email" : app.preferred_contact === "phone" ? "phone" : "text"} when there&rsquo;s news.
        </Callout>
      )}

      <div className="rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted">Application for</p>
            <p className="font-display text-2xl font-bold">
              {app.first_name} {app.last_name}
            </p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        {app.submitted_at && (
          <p className="mt-3 text-muted">
            Confirmation number{" "}
            <strong className="font-display text-ink">{app.id.slice(0, 8).toUpperCase()}</strong>
          </p>
        )}

        {app.status !== "draft" && (
          <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Progress">
            {TRACK.map((t, i) => (
              <li key={t.label}>
                <span className={clsx("block h-2 rounded-full", i <= current ? "bg-leaf" : "bg-bark-deep")} />
                <span className={clsx("mt-2 flex items-center gap-1 text-sm", i <= current ? "font-bold text-oak" : "text-muted")}>
                  {i < current && <Check size={14} aria-hidden />}
                  {t.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {app.status === "draft" && (
        <div className="space-y-3">
          <p className="text-lg">Your application is saved but not submitted yet.</p>
          <Link href="/apply" className="btn btn-primary">
            Continue your application
          </Link>
        </div>
      )}

      {app.status === "needs_info" && (
        <div className="space-y-4">
          <Callout tone="warn" title="We need a bit more from you">
            {requests.map((r) => (
              <p key={r.id} className="whitespace-pre-line">{r.message}</p>
            ))}
          </Callout>
          <Link href="/apply" className="btn btn-primary">
            Update your application
          </Link>
        </div>
      )}

      {(app.status === "submitted" || app.status === "under_review") && (
        <p className="text-lg">
          There&rsquo;s nothing you need to do right now. Questions? Call{" "}
          <a className="font-bold underline" href={`tel:${PROGRAM.contact.phone.replace(/\D/g, "")}`}>{PROGRAM.contact.phone}</a>.
        </p>
      )}

      {app.status === "approved" && (
        <Callout tone="info" title="You're eligible for the Community Equity Endowment.">
          We&rsquo;ll be in touch about next steps. Details about the benefit will be posted on the{" "}
          <Link className="underline" href="/benefit">Benefit page</Link>.
        </Callout>
      )}

      {app.status === "denied" && (
        <Callout tone="warn" title="We weren't able to confirm your eligibility.">
          {app.decision_reason && <p className="whitespace-pre-line">{app.decision_reason}</p>}
          <p className="mt-2">
            If you think this is a mistake or have more documents, <Link className="underline" href="/help">contact the CEE team</Link>.
          </p>
        </Callout>
      )}

      <form action="/auth/signout" method="post">
        <button className="font-bold text-muted underline">Sign out</button>
      </form>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/my-application">) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-4xl font-extrabold text-oak">My application</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <MyApplication searchParams={searchParams as Promise<{ submitted?: string }>} />
      </Suspense>
    </div>
  );
}
