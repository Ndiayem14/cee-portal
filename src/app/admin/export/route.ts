import { NextResponse, type NextRequest } from "next/server";
import { audit, requireStaff } from "@/lib/staff";
import type { Application, ApplicationStatus } from "@/lib/types";

const GROUPS: Record<string, ApplicationStatus[]> = {
  open: ["submitted", "under_review"],
  needs_info: ["needs_info"],
  approved: ["approved"],
  denied: ["denied"],
  draft: ["draft"],
};

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything; neutralize spreadsheet formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV of applicant contact details and status. Never includes document links or ID details. */
export async function GET(req: NextRequest) {
  const ctx = await requireStaff("/admin");
  if (!ctx) return new NextResponse("Staff access required", { status: 403 });

  const key = req.nextUrl.searchParams.get("status") ?? "approved";
  const statuses = GROUPS[key] ?? GROUPS.approved;

  const { data } = await ctx.supabase
    .from("applications")
    .select("id, status, first_name, last_name, phone, email, current_address, current_zip, move_in_year, preferred_contact, preferred_language, submitted_at, decided_at")
    .in("status", statuses)
    .order("last_name");

  const cols = [
    "id", "status", "first_name", "last_name", "phone", "email", "current_address", "current_zip",
    "move_in_year", "preferred_contact", "preferred_language", "submitted_at", "decided_at",
  ] as const;
  const rows = ((data ?? []) as Partial<Application>[]).map((r) => cols.map((c) => csvCell(r[c])).join(","));
  const csv = [cols.join(","), ...rows].join("\r\n");

  await audit(ctx, "export_csv", null, { detail: { status: key, rows: rows.length } });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cee-applications-${key}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
