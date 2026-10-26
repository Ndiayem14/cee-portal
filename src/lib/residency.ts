import { PROGRAM, RESIDENCY_YEARS } from "@/config/program";
import type { AddressPeriod, DocumentRow } from "./types";

/** Month index: year * 12 + (month - 1). Easy to compare and count. */
function toIndex(isoMonth: string): number {
  const [y, m] = isoMonth.split("-").map(Number);
  return y * 12 + (m - 1);
}

function fromIndex(i: number): { year: number; month: number } {
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonth(isoMonth: string | null | undefined): string {
  if (!isoMonth) return "Now";
  const { year, month } = fromIndex(toIndex(isoMonth));
  return `${MONTHS[month - 1]} ${year}`;
}

export function monthInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 7) : "";
}

export function toIsoMonth(monthInput: string): string {
  return `${monthInput}-01`;
}

function windowBounds(today = new Date()) {
  const start = PROGRAM.residencyStartYear * 12;
  const end = Math.min(
    PROGRAM.residencyEndYear * 12 + 11,
    today.getFullYear() * 12 + today.getMonth(),
  );
  return { start, end };
}

export type Gap = { from: string; to: string; months: number };

/**
 * Months in the residency window that aren't covered by an address
 * marked as being in the neighborhood.
 */
export function findGaps(addresses: AddressPeriod[], today = new Date()): Gap[] {
  const { start, end } = windowBounds(today);
  const nowIdx = today.getFullYear() * 12 + today.getMonth();
  const covered = new Set<number>();
  for (const a of addresses) {
    if (!a.in_neighborhood) continue;
    const from = toIndex(a.moved_in);
    const to = a.moved_out ? toIndex(a.moved_out) : nowIdx;
    for (let i = Math.max(from, start); i <= Math.min(to, end); i++) covered.add(i);
  }
  const gaps: Gap[] = [];
  let runStart: number | null = null;
  for (let i = start; i <= end + 1; i++) {
    const missing = i <= end && !covered.has(i);
    if (missing && runStart === null) runStart = i;
    if (!missing && runStart !== null) {
      const a = fromIndex(runStart);
      const b = fromIndex(i - 1);
      gaps.push({
        from: `${a.year}-${String(a.month).padStart(2, "0")}-01`,
        to: `${b.year}-${String(b.month).padStart(2, "0")}-01`,
        months: i - runStart,
      });
      runStart = null;
    }
  }
  return gaps;
}

/** For each year in the window, whether at least one residency document is dated that year. */
export function yearCoverage(docs: Pick<DocumentRow, "kind" | "document_date">[]): Record<number, number> {
  const counts: Record<number, number> = Object.fromEntries(RESIDENCY_YEARS.map((y) => [y, 0]));
  for (const d of docs) {
    if (d.kind !== "residency" || !d.document_date) continue;
    const y = Number(d.document_date.slice(0, 4));
    if (y in counts) counts[y] += 1;
  }
  return counts;
}

export function missingYears(docs: Pick<DocumentRow, "kind" | "document_date">[]): number[] {
  const c = yearCoverage(docs);
  return RESIDENCY_YEARS.filter((y) => c[y] === 0);
}

/**
 * Timeline segments for drawing the address bar, as percentages of the window.
 */
export function timelineSegments(addresses: AddressPeriod[], today = new Date()) {
  const { start, end } = windowBounds(today);
  const span = end - start + 1;
  const nowIdx = today.getFullYear() * 12 + today.getMonth();
  return addresses
    .map((a) => {
      const from = Math.max(toIndex(a.moved_in), start);
      const to = Math.min(a.moved_out ? toIndex(a.moved_out) : nowIdx, end);
      if (to < from) return null;
      return {
        id: a.id,
        inArea: a.in_neighborhood,
        left: ((from - start) / span) * 100,
        width: ((to - from + 1) / span) * 100,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}
