import clsx from "clsx";
import { Check } from "lucide-react";
import { RESIDENCY_YEARS } from "@/config/program";

/**
 * The 10-year residency window as a row of year blocks.
 * covered[year] > 0 fills the block. Used on the home page and in the application.
 */
export function YearRibbon({
  covered,
  size = "md",
  animate = false,
  label = "Years with proof of residence",
}: {
  covered?: Record<number, number>;
  size?: "md" | "lg";
  animate?: boolean;
  label?: string;
}) {
  const done = covered ? RESIDENCY_YEARS.filter((y) => (covered[y] ?? 0) > 0).length : 0;
  return (
    <figure aria-label={`${label}: ${done} of ${RESIDENCY_YEARS.length}`}>
      <ol className={clsx("grid grid-cols-5 gap-1.5", size === "md" && "sm:grid-cols-10", size === "lg" && "gap-2")}>
        {RESIDENCY_YEARS.map((year, i) => {
          const isCovered = covered ? (covered[year] ?? 0) > 0 : true;
          return (
            <li
              key={year}
              style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
              className={clsx(
                "relative flex flex-col justify-between rounded-lg border-2 p-2",
                size === "lg" ? "h-20 sm:h-24" : "h-16",
                isCovered
                  ? "border-leaf bg-leaf text-white"
                  : "border-dashed border-sun bg-sun-wash text-ink",
                animate && "ribbon-fill",
              )}
            >
              <span className={clsx("font-display font-bold", size === "lg" ? "text-base sm:text-lg" : "text-sm")}>
                {year}
              </span>
              <span className="text-xs">
                {isCovered ? (
                  <Check size={16} aria-label="covered" />
                ) : (
                  <span className="sr-only">missing</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <style>{`
        @keyframes ribbon-fill { from { background: white; color: var(--color-ink); border-color: var(--color-line); } }
        .ribbon-fill { animation: ribbon-fill 500ms ease-out both; }
      `}</style>
    </figure>
  );
}
