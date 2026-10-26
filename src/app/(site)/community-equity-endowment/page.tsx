import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageIntro } from "@/components/PageIntro";
import { PROGRAM } from "@/config/program";

export const metadata: Metadata = { title: "What is a Community Equity Endowment?" };

// CONTENT: review with EC. The "In Congress Heights" section needs EC's program details.
export default function CEEPage() {
  return (
    <>
      <PageIntro
        title="What is a Community Equity Endowment?"
        lead="A way for neighbors to share in the value that new development creates in their community."
      />
      <PageBody>
        <h2>The short version</h2>
        <p>
          When a new building or shopping area goes up, it usually becomes more valuable over time. Normally that value
          goes only to the developers and investors. A Community Equity Endowment sets aside a share of it for the
          people who live in the neighborhood.
        </p>

        <h2>Why it matters</h2>
        <p>
          For generations, practices like redlining and discrimination in hiring and lending kept many families of
          color from building wealth through homes and businesses. When neighborhoods like
          Congress Heights see new investment, long-time residents often don&rsquo;t share in the gains, and some are
          priced out.
        </p>
        <p>
          A Community Equity Endowment is one answer to that. Instead of benefits ending when construction does, the
          neighborhood holds a lasting stake in the development&rsquo;s success.
        </p>

        <h2>How it works</h2>
        <ul>
          <li>Part of the development&rsquo;s equity, or ownership value, is set aside for the community.</li>
          <li>That share is held in an endowment: a fund meant to last for the long term.</li>
          <li>As the development does well, the endowment can grow.</li>
          <li>Eligible residents receive a financial benefit from it.</li>
          <li>
            Community members help guide decisions through the{" "}
            <Link href="/community-advisory-board">Community Advisory Board</Link>.
          </li>
        </ul>

        <h2>In Congress Heights</h2>
        <p>
          This endowment is being created as part of the{" "}
          <Link href="/sycamore-and-oak">Sycamore &amp; Oak</Link> development. It&rsquo;s for long-time residents who
          have lived in {PROGRAM.neighborhood} since {PROGRAM.residencyStartYear}. Details about the benefit itself will
          be shared on the <Link href="/benefit">Benefit page</Link> as they&rsquo;re finalized.
        </p>

        <h2>Read the research</h2>
        <p>
          The idea is described in{" "}
          <a
            href="https://www.urban.org/research/publication/community-equity-endowments"
            target="_blank"
            rel="noreferrer"
          >
            Community Equity Endowments: A New Form of Community Benefit
          </a>
          , by Brett Theodos, Leiha Edmonds and Dan Tangherlini at the Urban Institute (2021).
        </p>

        <p className="mt-10">
          <Link href="/apply" className="btn btn-primary !text-white !no-underline">
            Start your application
          </Link>
        </p>
      </PageBody>
    </>
  );
}
