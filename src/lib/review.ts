import { isEligibleZip, RESIDENCY_YEARS } from "@/config/program";
import { findGaps, missingYears } from "./residency";
import type { AddressPeriod, Application, DocumentRow } from "./types";

export type CheckItem = { label: string; ok: boolean; detail?: string };

/** Automatic checks shown to reviewers. They inform the decision; a person still makes it. */
export function reviewChecklist(app: Application, addresses: AddressPeriod[], docs: DocumentRow[]): CheckItem[] {
  const residency = docs.filter((d) => d.kind === "residency");
  const missing = missingYears(residency);
  const gaps = findGaps(addresses);
  const hasFront = docs.some((d) => d.kind === "id_front");
  const hasBack = docs.some((d) => d.kind === "id_back");

  return [
    {
      label: "Photo ID uploaded",
      ok: hasFront && (hasBack || app.id_type === "passport"),
      detail: hasFront ? (hasBack || app.id_type === "passport" ? undefined : "Back of ID missing") : "No ID uploaded",
    },
    {
      label: "Current address in eligible ZIP",
      ok: isEligibleZip(app.current_zip),
      detail: isEligibleZip(app.current_zip) ? undefined : `ZIP ${app.current_zip ?? "missing"}; check the address`,
    },
    {
      label: "Address history covers the full window",
      ok: addresses.length > 0 && gaps.length === 0,
      detail: gaps.length ? `${gaps.reduce((n, g) => n + g.months, 0)} months not covered` : undefined,
    },
    {
      label: `Documents for all ${RESIDENCY_YEARS.length} years`,
      ok: missing.length === 0,
      detail: missing.length ? `Missing ${missing.join(", ")}` : undefined,
    },
    {
      label: "Attested, consented and signed",
      ok: app.attested && app.consented && !!app.signature_name,
    },
  ];
}

/** Applications that share an email, phone number, or full name with another. */
export function findDuplicates(apps: Pick<Application, "id" | "email" | "phone" | "first_name" | "last_name">[]) {
  const keyMap = new Map<string, string[]>();
  const add = (key: string | null, id: string) => {
    if (!key) return;
    keyMap.set(key, [...(keyMap.get(key) ?? []), id]);
  };
  for (const a of apps) {
    add(a.email ? `e:${a.email.trim().toLowerCase()}` : null, a.id);
    const digits = a.phone?.replace(/\D/g, "").slice(-10);
    add(digits && digits.length === 10 ? `p:${digits}` : null, a.id);
    add(
      a.first_name && a.last_name ? `n:${a.first_name.trim().toLowerCase()} ${a.last_name.trim().toLowerCase()}` : null,
      a.id,
    );
  }
  const dupes = new Map<string, Set<string>>();
  for (const ids of keyMap.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const set = dupes.get(id) ?? new Set();
      ids.filter((x) => x !== id).forEach((x) => set.add(x));
      dupes.set(id, set);
    }
  }
  return dupes;
}
