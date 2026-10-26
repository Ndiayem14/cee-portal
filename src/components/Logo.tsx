/** Simple mark: two overlapping leaves (sycamore + oak) over a ground line. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="36" height="36" className="shrink-0" viewBox="0 0 36 36" aria-hidden="true">
        <rect width="36" height="36" rx="10" fill={inverted ? "#ffffff" : "var(--color-oak)"} />
        <path
          d="M12 25c0-7 4-12 10-14-1 6-4 11-10 14Z"
          fill={inverted ? "var(--color-oak)" : "var(--color-leaf-bright)"}
        />
        <path d="M24 25c0-6-3-10-8-12 0 5 3 9 8 12Z" fill={inverted ? "var(--color-leaf)" : "#ffffff"} opacity=".9" />
        <rect x="8" y="26" width="20" height="2" rx="1" fill={inverted ? "var(--color-oak)" : "#ffffff"} />
      </svg>
      <span className="min-w-0 leading-tight">
        <span className={`block font-display text-[0.95rem] font-bold sm:text-[1.05rem] ${inverted ? "text-white" : "text-oak"}`}>
          Community Equity Endowment
        </span>
        <span className={`block text-[0.8rem] ${inverted ? "text-white/75" : "text-muted"}`}>
          at Sycamore &amp; Oak
        </span>
      </span>
    </span>
  );
}
