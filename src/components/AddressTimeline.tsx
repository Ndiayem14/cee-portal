import clsx from "clsx";
import { PROGRAM } from "@/config/program";
import { timelineSegments } from "@/lib/residency";
import type { AddressPeriod } from "@/lib/types";

/** Horizontal bar of the residency window, with each address drawn as a segment. */
export function AddressTimeline({ addresses }: { addresses: AddressPeriod[] }) {
  const segments = timelineSegments(addresses);
  return (
    <div aria-hidden className="select-none">
      <div className="relative h-8 overflow-hidden rounded-lg border-2 border-dashed border-sun bg-sun-wash">
        {segments.map((s) => (
          <div
            key={s.id}
            className={clsx(
              "absolute inset-y-0 border-r-2 border-white",
              s.inArea ? "bg-leaf" : "bg-muted/40",
            )}
            style={{ left: `${s.left}%`, width: `${s.width}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-sm text-muted">
        <span>{PROGRAM.residencyStartYear}</span>
        <span>Now</span>
      </div>
    </div>
  );
}
