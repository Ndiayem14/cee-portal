import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CircleCheck, CircleDashed, ExternalLink, FileText, IdCard } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaff } from "@/lib/staff";
import { reviewChecklist, findDuplicates } from "@/lib/review";
import { findGaps, formatMonth, yearCoverage } from "@/lib/residency";
import { ID_TYPES, RESIDENCY_YEARS, docTypeLabel } from "@/config/program";
import { SetupNotice } from "@/components/SetupNotice";
import { NotStaff } from "@/components/NotStaff";
import { StatusBadge } from "@/components/StatusBadge";
import { YearRibbon } from "@/components/YearRibbon";
import { AddressTimeline } from "@/components/AddressTimeline";
import type { AddressPeriod, Application, DocumentRow, InfoRequest } from "@/lib/types";
import { addNote, decide, markUnderReview, requestInfo } from "../../actions";

type Note = { id: string; body: string; author_email: string | null; created_at: string };
type AuditRow = { id: number; action: string; actor_email: string | null; created_at: string; detail: Record<string, unknown> | null };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-oak">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DocLink({ doc }: { doc: DocumentRow }) {
  return (
    <a
      href={`/admin/documents/${doc.id}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-bold text-leaf underline"
    >
      Open <ExternalLink size={14} aria-hidden />
      <span className="sr-only">{doc.file_name}</span>
    </a>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireStaff(`/admin/applications/${id}`);
  if (!ctx) return <NotStaff />;

  const { data: appData } = await ctx.supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (!appData) notFound();
  const app = appData as Application;

  const [addrRes, docRes, reqRes, noteRes, auditRes, othersRes] = await Promise.all([
    ctx.supabase.from("address_history").select("*").eq("application_id", id).order("moved_in"),
    ctx.supabase.from("documents").select("*").eq("application_id", id).order("document_date"),
    ctx.supabase.from("info_requests").select("*").eq("application_id", id).order("created_at", { ascending: false }),
    ctx.supabase.from("review_notes").select("id, body, author_email, created_at").eq("application_id", id).order("created_at"),
    ctx.role === "admin"
      ? ctx.supabase.from("audit_log").select("id, action, actor_email, created_at, detail").eq("application_id", id).order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    ctx.supabase.from("applications").select("id, email, phone, first_name, last_name").neq("status", "draft"),
  ]);

  const addresses = (addrRes.data ?? []) as AddressPeriod[];
  const docs = (docRes.data ?? []) as DocumentRow[];
  const requests = (reqRes.data ?? []) as InfoRequest[];
  const notes = (noteRes.data ?? []) as Note[];
  const auditRows = (auditRes.data ?? []) as AuditRow[];
  const dupes = findDuplicates([...(othersRes.data ?? []), app] as Application[]).get(app.id);

  const checks = reviewChecklist(app, addresses, docs);
  const gaps = findGaps(addresses);
  const residency = docs.filter((d) => d.kind === "residency");
  const idDocs = docs.filter((d) => d.kind !== "residency");
  const decided = app.status === "approved" || app.status === "denied";

  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1 font-bold text-oak hover:underline">
        <ArrowLeft size={18} aria-hidden /> All applications
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-oak">
            {app.first_name} {app.last_name}
          </h1>
          <p className="mt-1 text-muted">
            #{app.id.slice(0, 8).toUpperCase()}
            {app.submitted_at && <>, submitted {when(app.submitted_at)}</>}
          </p>
        </div>
        <StatusBadge status={app.status} staff />
      </div>

      {dupes && dupes.size > 0 && (
        <div className="mt-4 rounded-xl bg-alert-wash p-4 text-alert">
          <p className="font-bold">Possible duplicate</p>
          <p>
            Shares an email, phone number or name with:{" "}
            {[...dupes].map((d, i) => (
              <span key={d}>
                {i > 0 && ", "}
                <Link className="underline" href={`/admin/applications/${d}`}>#{d.slice(0, 8).toUpperCase()}</Link>
              </span>
            ))}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Left: the evidence */}
        <div className="space-y-6">
          <Section title="Applicant">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                ["Phone", app.phone],
                ["Email", app.email],
                ["Current address", `${app.current_address ?? ""}, ${app.current_zip ?? ""}`],
                ["Moved to Congress Heights", app.move_in_year],
                ["Prefers", `${app.preferred_contact ?? "–"}, in ${app.preferred_language ?? "English"}`],
                ["Helped by", app.helper_name || "Nobody listed"],
                ["Signed as", app.signature_name],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-bold">{v ?? "–"}</dd>
                </div>
              ))}
            </dl>
            {app.household_note && (
              <div className="mt-4 rounded-xl bg-bark p-4">
                <p className="text-sm text-muted">Note about household</p>
                <p className="whitespace-pre-line">{app.household_note}</p>
              </div>
            )}
          </Section>

          <Section title="Address history" aside={gaps.length > 0 && <span className="text-sm font-bold text-ink">{gaps.length} gap{gaps.length > 1 && "s"}</span>}>
            <AddressTimeline addresses={addresses} />
            <ul className="mt-4 divide-y divide-line">
              {[...addresses].reverse().map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-2.5">
                  <span>
                    <span className="font-bold">{a.address}</span>
                    {!a.in_neighborhood && <span className="ml-2 rounded-full bg-bark-deep px-2 py-0.5 text-sm">outside area</span>}
                  </span>
                  <span className="shrink-0 text-muted">
                    {formatMonth(a.moved_in)} – {a.moved_out ? formatMonth(a.moved_out) : "now"}
                  </span>
                </li>
              ))}
            </ul>
            {gaps.length > 0 && (
              <p className="mt-3 rounded-lg bg-sun-wash p-3 text-sm">
                Not covered: {gaps.map((g) => `${formatMonth(g.from)} – ${formatMonth(g.to)}`).join("; ")}
              </p>
            )}
          </Section>

          <Section title="Photo ID" aside={<span className="text-sm text-muted">{ID_TYPES.find((t) => t.value === app.id_type)?.label}</span>}>
            {idDocs.length === 0 ? (
              <p className="text-muted">No ID uploaded.</p>
            ) : (
              <ul className="divide-y divide-line">
                {idDocs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <IdCard className="text-leaf" size={20} aria-hidden />
                      {d.kind === "id_front" ? "Front" : "Back"}
                    </span>
                    <DocLink doc={d} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Residency documents" aside={<span className="text-sm text-muted">{residency.length} files</span>}>
            <YearRibbon covered={yearCoverage(residency)} />
            <ul className="mt-4 divide-y divide-line">
              {RESIDENCY_YEARS.map((y) => {
                const items = residency.filter((d) => d.document_date?.startsWith(String(y)));
                return (
                  <li key={y} className="grid grid-cols-[4rem_1fr] gap-3 py-2.5">
                    <span className="font-display font-bold">{y}</span>
                    {items.length === 0 ? (
                      <span className="text-muted">Nothing uploaded</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4">
                            <span className="flex items-center gap-2">
                              <FileText className="shrink-0 text-leaf" size={18} aria-hidden />
                              {docTypeLabel(d.doc_type)}, {formatMonth(d.document_date)}
                              {d.address_id && (
                                <span className="text-sm text-muted">
                                  ({addresses.find((a) => a.id === d.address_id)?.address ?? "address removed"})
                                </span>
                              )}
                            </span>
                            <DocLink doc={d} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        {/* Right: the decision */}
        <aside className="space-y-6">
          <Section title="Checklist">
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2.5">
                  {c.ok ? (
                    <CircleCheck className="mt-0.5 shrink-0 text-leaf" size={20} aria-label="Pass" />
                  ) : (
                    <CircleDashed className="mt-0.5 shrink-0 text-sun" size={20} aria-label="Check" />
                  )}
                  <span>
                    {c.label}
                    {c.detail && <span className="block text-sm text-muted">{c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">Automatic checks. Open each document to confirm name, address and date.</p>
          </Section>

          {!decided && app.status !== "draft" && (
            <Section title="Decision">
              {app.status === "submitted" && (
                <form action={markUnderReview} className="mb-4">
                  <input type="hidden" name="id" value={app.id} />
                  <button className="btn btn-quiet w-full">I&rsquo;m reviewing this</button>
                </form>
              )}
              <form action={decide} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <label className="block">
                  <span className="field-label">Reason or note to applicant</span>
                  <span className="field-hint">Required if not eligible. The applicant will see this.</span>
                  <textarea name="reason" className="input min-h-24" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button name="decision" value="approved" className="btn btn-primary">Eligible</button>
                  <button name="decision" value="denied" className="btn btn-quiet !text-alert">Not eligible</button>
                </div>
              </form>
            </Section>
          )}

          {decided && (
            <Section title="Decision">
              <p>
                Marked <strong>{app.status === "approved" ? "eligible" : "not eligible"}</strong>
                {app.decided_at && <> on {when(app.decided_at)}</>}.
              </p>
              {app.decision_reason && <p className="mt-2 whitespace-pre-line text-muted">{app.decision_reason}</p>}
            </Section>
          )}

          {app.status !== "draft" && !decided && (
            <Section title="Ask for more">
              <form action={requestInfo} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <label className="block">
                  <span className="field-label">What do they need to send?</span>
                  <span className="field-hint">Be specific. This goes to the applicant by email and in the portal.</span>
                  <textarea
                    name="message"
                    required
                    className="input min-h-28"
                    placeholder="For example: Please upload one document showing your address in 2019, such as a bill or tax form."
                  />
                </label>
                <button className="btn btn-quiet w-full">Send request</button>
              </form>
              {requests.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  {requests.map((r) => (
                    <li key={r.id}>
                      <span className="text-muted">{when(r.created_at)} {r.resolved_at ? "(answered)" : "(open)"}</span>
                      <p className="whitespace-pre-line">{r.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          <Section title="Team notes">
            {notes.length === 0 ? (
              <p className="text-muted">No notes yet. Applicants never see these.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-bark p-3">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="mt-1 text-sm text-muted">
                      {n.author_email ?? "Staff"}, {when(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <form action={addNote} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={app.id} />
              <textarea name="body" required aria-label="New note" className="input min-h-20" placeholder="Add a note for the team" />
              <button className="btn btn-quiet w-full">Add note</button>
            </form>
          </Section>

          {ctx.role === "admin" && (
            <Section title="Activity log">
              {auditRows.length === 0 ? (
                <p className="text-muted">No staff activity yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {auditRows.map((a) => (
                    <li key={a.id}>
                      <span className="font-bold">{a.action.replace(/_/g, " ")}</span>
                      {a.detail?.file ? ` (${String(a.detail.file)})` : a.detail?.status ? ` → ${String(a.detail.status)}` : ""}
                      <span className="block text-muted">
                        {a.actor_email ?? "staff"}, {when(a.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}

export default function ApplicationDetailPage({ params }: PageProps<"/admin/applications/[id]">) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <Suspense fallback={<p className="text-muted">Loading application…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
