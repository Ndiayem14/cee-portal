import clsx from "clsx";
import { STATUS_LABEL, type ApplicationStatus } from "@/lib/types";

const TONE: Record<ApplicationStatus, string> = {
  draft: "bg-bark-deep text-ink",
  submitted: "bg-leaf-wash text-oak",
  under_review: "bg-leaf-wash text-oak",
  needs_info: "bg-sun-wash text-ink ring-1 ring-sun",
  approved: "bg-leaf text-white",
  denied: "bg-alert-wash text-alert",
};

export function StatusBadge({ status, staff = false }: { status: ApplicationStatus; staff?: boolean }) {
  const label = staff && status === "draft" ? "Draft" : STATUS_LABEL[status];
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-sm font-bold", TONE[status])}>
      {label}
    </span>
  );
}
