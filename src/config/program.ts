/**
 * Program settings. Everything EC still needs to confirm is marked "CONFIRM".
 * Change values here, not in individual pages.
 */
export const PROGRAM = {
  name: "Community Equity Endowment",
  shortName: "CEE",
  neighborhood: "Congress Heights",

  /**
   * CONFIRM: residency window.
   * The form says "since 2017" and the requirement says "10 years".
   * We read that as the 10 calendar years 2017 through 2026.
   */
  residencyStartYear: 2017,
  residencyEndYear: 2026,

  /**
   * CONFIRM: neighborhood boundary.
   * For now an address counts as in-area if it's in one of these ZIP codes.
   * Replace with a map-boundary check once EC provides the boundary.
   */
  eligibleZips: ["20032"],

  /** CONFIRM: real contact details for the CEE team. */
  contact: {
    phone: "(202) 555-0100",
    email: "cee@example.org",
    inPerson: "Sycamore & Oak, 1110 Oak Dr. SE, Washington, DC 20032",
    hours: "Tuesday to Thursday, 12 to 5 pm. Friday and Saturday, 12 to 6 pm.",
  },

  /** Upload limits. Keep in sync with supabase/migrations (bucket settings). */
  uploads: {
    maxBytes: 10 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/heic,image/heif,image/webp,application/pdf",
  },
} as const;

export const RESIDENCY_YEARS: number[] = Array.from(
  { length: PROGRAM.residencyEndYear - PROGRAM.residencyStartYear + 1 },
  (_, i) => PROGRAM.residencyStartYear + i,
);

export const RESIDENCY_DOC_TYPES = [
  { value: "utility_bill", label: "Electric, gas or water bill", group: "Household or utility records" },
  { value: "internet_phone_bill", label: "Internet or phone bill", group: "Household or utility records" },
  { value: "insurance_statement", label: "Insurance statement", group: "Household or utility records" },
  { value: "other_household", label: "Other dated household record", group: "Household or utility records" },
  { value: "dc_benefits", label: "DC government benefits letter", group: "Official or institutional records" },
  { value: "tax_record", label: "Tax record", group: "Official or institutional records" },
  { value: "school_record", label: "School enrollment record", group: "Official or institutional records" },
  { value: "housing_record", label: "Lease or housing provider record", group: "Official or institutional records" },
  { value: "other_official", label: "Other official document", group: "Official or institutional records" },
] as const;

export const ID_TYPES = [
  { value: "dc_drivers_license", label: "DC driver's license" },
  { value: "dc_id_card", label: "DC non-driver ID card" },
  { value: "passport", label: "Passport" },
  { value: "other_gov_id", label: "Other government photo ID" },
] as const;

export const LANGUAGES = ["English", "Español", "Amharic", "French", "Other"] as const;

export function docTypeLabel(value: string | null | undefined): string {
  return (
    RESIDENCY_DOC_TYPES.find((d) => d.value === value)?.label ??
    ID_TYPES.find((d) => d.value === value)?.label ??
    "Document"
  );
}

export function isEligibleZip(zip: string | null | undefined): boolean {
  return !!zip && (PROGRAM.eligibleZips as readonly string[]).includes(zip.trim().slice(0, 5));
}
