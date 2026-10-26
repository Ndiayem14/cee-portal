export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_info"
  | "approved"
  | "denied";

export type Application = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  current_step: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  current_address: string | null;
  current_zip: string | null;
  move_in_year: number | null;
  preferred_language: string | null;
  preferred_contact: "text" | "email" | "phone" | null;
  helper_name: string | null;
  household_note: string | null;
  id_type: string | null;
  attested: boolean;
  consented: boolean;
  signature_name: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AddressPeriod = {
  id: string;
  application_id: string;
  address: string;
  in_neighborhood: boolean;
  moved_in: string; // YYYY-MM-01
  moved_out: string | null; // null = still lives here
  created_at: string;
};

export type DocumentRow = {
  id: string;
  application_id: string;
  kind: "id_front" | "id_back" | "residency";
  doc_type: string | null;
  document_date: string | null; // YYYY-MM-01
  address_id: string | null;
  storage_path: string;
  file_name: string;
  size_bytes: number | null;
  created_at: string;
};

export type InfoRequest = {
  id: string;
  application_id: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Not submitted yet",
  submitted: "Submitted",
  under_review: "Under review",
  needs_info: "More information needed",
  approved: "Eligible",
  denied: "Not eligible",
};
