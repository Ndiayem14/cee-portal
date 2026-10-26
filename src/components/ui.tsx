import clsx from "clsx";
import { AlertTriangle, Info } from "lucide-react";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      {children}
    </label>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "error";
  title?: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={clsx(
        "flex gap-3 rounded-xl p-4",
        tone === "info" && "bg-leaf-wash text-oak",
        tone === "warn" && "bg-sun-wash text-ink",
        tone === "error" && "bg-alert-wash text-alert",
      )}
    >
      <Icon className="mt-0.5 shrink-0" size={22} aria-hidden />
      <div>
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={clsx(title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}
