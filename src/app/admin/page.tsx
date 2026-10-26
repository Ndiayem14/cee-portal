import Link from "next/link";
import { Suspense } from "react";
import { Copy, Download } from "lucide-react";
import clsx from "clsx";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaff } from "@/lib/staff";
import { findDuplicates } from "@/lib/review";
import { missingYears } from "@/lib/residency";
import { isEligibleZip, RESIDENCY_YEARS } from "@/config/program";
import { SetupNotice } from "@/components/SetupNotice";
import { NotStaff } from "@/components/NotStaff";
import { StatusBadge } from "@/components/StatusBadge";
import type { Application, ApplicationStatus, DocumentRow } from "@/lib/types";

const FILTERS: { key: string; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "open", label: "To review", statuses: ["submitted", "under_review"] },
  { key: "needs_info", label: "Waiting on applicant", statuses: ["needs_info"] },
  { key: "approved", label: "Eligible", statuses: ["approved"] },
  { key: "denied", label: "Not eligible", statuses: ["denied"] },
  { key: "draft", label: "Drafts", statuses: ["draft"] },
];

type Search = { status?: string; q?: string };

async function Queue({ searchParams }: { searchParams: Promise<Search> }) {
  const ctx = await requireStaff("/admin");
  if (!ctx) return <NotStaff />;
  const { status = "open", q = "" } = await searchParams;
  const filter = FILTERS.find((f) => f.key === status) ?? FILTERS[0];

  // TODO: paginate once there are more than a few thousand applications.
  const { data: all } = await ctx.supabase
    .from("applications")
    .select("id, status, first_name, last_name, email, phone, current_zip, submitted_at, updated_at")
    .order("submitted_at", { ascending: true, nullsFirst: false });
  const apps = (all ?? []) as Application[];

  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.key, apps.filter((a) => f.statuses.includes(a.status)).length]),
  );
  const dupes = findDuplicates(apps.filter((a) => a.status !== "draft"));

  const needle = q.trim().toLowerCase();
  const rows = apps.filter(
    (a) =>
      filter.statuses.includes(a.status) &&
      (!needle ||
        `${a.first_name ?? ""} ${a.last_name ?? ""} ${a.email ?? ""} ${a.phone ?? ""} ${a.id}`.toLowerCase().includes(needle)),
  );

  const { data: docData } = rows.length
    ? await ctx.supabase
        .from("documents")
        .select("application_id, kind, document_date")
        .in("application_id", rows.map((r) => r.id))
    : { data: [] };
  const docsByApp = new Map<string, Pick<DocumentRow, "kind" | "document_date">[]>();
  for (const d of (docData ?? []) as (Pick<DocumentRow, "kind" | "document_date"> & { application_id: string })[]) {
    docsByApp.set(d.application_id, [...(docsByApp.get(d.application_id) ?? []), d]);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold text-oak">Applications</h1>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2">
            <input type="hidden" name="status" value={filter.key} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone"
              aria-label="Search applications"
              className="input !min-h-11 w-64 !py-2"
            />
            <button className="btn btn-quiet !min-h-11">Search</button>
          </form>
          <a href={`/admin/export?status=${filter.key}`} className="btn btn-quiet !min-h-11">
            <Download size={18} aria-hidden /> Export CSV
          </a>
        </div>
      </div>

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin?status=${f.key}`}
            aria-current={f.key === filter.key ? "page" : undefined}
            className={clsx(
              "rounded-full border-2 px-4 py-2 font-bold",
              f.key === filter.key ? "border-oak bg-oak text-white" : "border-line bg-white hover:border-oak",
            )}
          >
            {f.label} <span className={clsx("ml-1", f.key === filter.key ? "text-white/75" : "text-muted")}>{counts[f.key]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-muted">
            {needle ? "No applications match that search." : `Nothing in “${filter.label}” right now.`}
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">Applicant</th>
                <th className="px-4 py-3 font-bold">Submitted</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Years covered</th>
                <th className="px-4 py-3 font-bold">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => {
                const docs = docsByApp.get(a.id) ?? [];
                const covered = RESIDENCY_YEARS.length - missingYears(docs).length;
                const hasId = docs.some((d) => d.kind === "id_front");
                return (
                  <tr key={a.id} className="hover:bg-bark">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${a.id}`} className="font-bold text-oak underline-offset-2 hover:underline">
                        {a.first_name || a.last_name ? `${a.first_name ?? ""} ${a.last_name ?? ""}` : "(no name yet)"}
                      </Link>
                      <p className="text-sm text-muted">{a.email ?? a.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} staff />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-20 overflow-hidden rounded-full bg-sun-wash">
                          <span className="block h-full bg-leaf" style={{ width: `${(covered / RESIDENCY_YEARS.length) * 100}%` }} />
                        </span>
                        <span className="text-sm">{covered}/{RESIDENCY_YEARS.length}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex flex-wrap gap-1.5">
                        {dupes.has(a.id) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-alert-wash px-2 py-0.5 font-bold text-alert">
                            <Copy size={13} aria-hidden /> Possible duplicate
                          </span>
                        )}
                        {!isEligibleZip(a.current_zip) && a.current_zip && (
                          <span className="rounded-full bg-sun-wash px-2 py-0.5">ZIP {a.current_zip}</span>
                        )}
                        {!hasId && a.status !== "draft" && <span className="rounded-full bg-sun-wash px-2 py-0.5">No ID</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <Suspense fallback={<p className="text-muted">Loading applications…</p>}>
      <Queue searchParams={searchParams as Promise<Search>} />
    </Suspense>
  );
}
