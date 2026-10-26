import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "Sycamore & Oak" };

// CONTENT: review with EC. Summarized from sycamoreandoak.com (October 2026).
export default function SycamoreAndOak() {
  return (
    <>
      <PageIntro
        title="Sycamore & Oak"
        lead="A retail and community village in the heart of Congress Heights, built as a place to eat, shop, gather and grow local businesses."
      />
      <PageBody>
        <h2>A space for the neighborhood</h2>
        <p>
          Sycamore &amp; Oak sits at 1110 Oak Drive SE, a short walk from the Congress Heights Metro station on the Green
          line. It brings together local food, fashion, beauty, wellness and creative businesses with a playground,
          green space and room for events.
        </p>
        <p>
          It was developed by Emerson Collective with partners including the Congress Heights Community Training and
          Development Corporation, Redbrick LMD, Banneker Communities, and the DC Office of the Deputy Mayor for
          Planning and Economic Development.
        </p>

        <h2>Who&rsquo;s there</h2>
        <h3>Food</h3>
        <p>Dionne&rsquo;s Good Food, Buna Talk Cafe, Fresh Food Factory, Glizzy&rsquo;s, and Today&rsquo;s Pizza.</p>
        <h3>Fashion, beauty and wellness</h3>
        <p>Black Bella, Paradyce, LoveMore Brand, Chris Pyrate, Vaya Beauty, and WeFitDC.</p>
        <h3>Culture and community</h3>
        <p>The Museum, Soufside Creative, and the Congress Heights Community Training and Development Corporation.</p>

        <h2>What happens here</h2>
        <p>
          Sycamore &amp; Oak hosts neighborhood events through the year, from Live at SOAK go-go nights to Halloween in
          the Heights and Go-Go Santa in December. Pop-up vendors and private rentals are welcome too.
        </p>

        <h2>Visit</h2>
        <p>
          Open Tuesday to Thursday from 12 to 5 pm, and Friday and Saturday from 12 to 6 pm. Closed Sunday and Monday.
        </p>
        <p>
          See shops and upcoming events at{" "}
          <a href="https://www.sycamoreandoak.com" target="_blank" rel="noreferrer">
            sycamoreandoak.com
          </a>
          .
        </p>

        <h2>How this connects to the endowment</h2>
        <p>
          The Community Equity Endowment is part of how Sycamore &amp; Oak shares its success with the people who have
          made Congress Heights home. <Link href="/community-equity-endowment">Read how the endowment works</Link>.
        </p>
      </PageBody>
    </>
  );
}
