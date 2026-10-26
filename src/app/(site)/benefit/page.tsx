import type { Metadata } from "next";

export const metadata: Metadata = { title: "Benefit" };

// Intentionally blank for now, as requested by EC. Will hold benefit details
// (and later, a signed-in view of each resident's benefit).
export default function BenefitPage() {
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto min-h-[50vh] max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pt-16">
        <h1 className="text-4xl font-extrabold text-oak sm:text-5xl">Benefit</h1>
      </div>
    </div>
  );
}
