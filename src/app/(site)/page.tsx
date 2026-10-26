import Link from "next/link";
import { CircleCheck, FileText, IdCard, MapPin } from "lucide-react";
import { PROGRAM } from "@/config/program";
import { YearRibbon } from "@/components/YearRibbon";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-end">
          <div>
            <h1 className="text-[2.6rem] font-extrabold text-oak sm:text-6xl">
              Ten years in Congress Heights. A share in what comes next.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
              The Community Equity Endowment sets aside part of the value of the Sycamore &amp; Oak development
              for long-time neighbors. If you&rsquo;ve lived in Congress Heights since {PROGRAM.residencyStartYear},
              you can apply to take part.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply" className="btn btn-primary">
                Start your application
              </Link>
              <Link href="/community-equity-endowment" className="btn btn-quiet">
                How the endowment works
              </Link>
            </div>
            <p className="mt-4 text-muted">
              Takes about 20 minutes. You can save and finish later.
            </p>
          </div>

          <div className="rounded-2xl bg-bark p-5 sm:p-6">
            <p className="font-display text-lg font-bold text-oak">Your residency, year by year</p>
            <p className="mb-4 mt-1 text-muted">
              Upload a bill, letter or record for each year. Every year you prove fills in a block.
            </p>
            <YearRibbon size="lg" animate />
          </div>
        </div>
      </section>

      {/* Who can apply */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-oak">Who can apply</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-3">
          {[
            ["You live in Congress Heights now.", "Your current home is in the neighborhood."],
            [
              `You've lived here since ${PROGRAM.residencyStartYear}.`,
              "Moves within Congress Heights are fine. We'll ask for each address.",
            ],
            ["You're 18 or older.", "Each adult in a household applies on their own."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <CircleCheck className="mt-0.5 shrink-0 text-leaf" size={26} aria-hidden />
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          {/* CONFIRM with EC: age requirement and one-application-per-adult rule. */}
          Not sure if you qualify? <Link className="underline" href="/help">Talk to the CEE team</Link> before you
          apply.
        </p>
      </section>

      {/* How it works: a real sequence, so it's numbered */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-bold text-oak">How applying works</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-4">
            {[
              ["Check if you qualify", "Answer three quick questions about where you live."],
              ["Tell us where you've lived", `List each address since ${PROGRAM.residencyStartYear}.`],
              ["Upload your documents", "A photo ID, plus bills or letters showing your address over the years."],
              ["We review and reply", "We'll text or email you. If we need anything else, we'll tell you exactly what."],
            ].map(([title, body], i) => (
              <li key={title}>
                <span className="grid size-10 place-items-center rounded-full bg-oak font-display text-lg font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-lg font-bold">{title}</p>
                <p className="text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What you'll need */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="text-3xl font-bold text-oak">What to have ready</h2>
          <p className="mt-3 text-muted">
            Photos from your phone are fine. You don&rsquo;t need everything at once: save your application and come back
            when you find more.
          </p>
        </div>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          <li className="flex gap-4 p-5">
            <IdCard className="shrink-0 text-leaf" size={28} aria-hidden />
            <div>
              <p className="font-bold">One photo ID</p>
              <p className="text-muted">DC driver&rsquo;s license, DC ID card, passport, or another government photo ID.</p>
            </div>
          </li>
          <li className="flex gap-4 p-5">
            <FileText className="shrink-0 text-leaf" size={28} aria-hidden />
            <div>
              <p className="font-bold">Proof of address for each year</p>
              <p className="text-muted">
                Utility, phone or internet bills, insurance statements, tax records, school records, DC benefits
                letters, or a lease. Each needs your name, address and a date.
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-5">
            <MapPin className="shrink-0 text-leaf" size={28} aria-hidden />
            <div>
              <p className="font-bold">Your past addresses</p>
              <p className="text-muted">Where you&rsquo;ve lived since {PROGRAM.residencyStartYear}, with rough move-in and move-out dates.</p>
            </div>
          </li>
        </ul>
      </section>

      {/* Learn more */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-oak">Learn more</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {[
            ["/sycamore-and-oak", "Sycamore & Oak", "The community-built retail village at the heart of Congress Heights."],
            ["/community-equity-endowment", "What is a Community Equity Endowment?", "How a share of a development's value can come back to the neighborhood."],
            ["/community-advisory-board", "The Community Advisory Board", "The neighbors who help guide the endowment."],
          ].map(([href, title, body]) => (
            <Link key={href} href={href} className="group bg-white p-6 hover:bg-leaf-wash">
              <p className="font-display text-xl font-bold text-oak group-hover:underline">{title}</p>
              <p className="mt-2 text-muted">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
