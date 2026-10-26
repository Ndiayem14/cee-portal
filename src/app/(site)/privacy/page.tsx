import type { Metadata } from "next";
import { PageBody, PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "How we protect your information" };

// CONTENT: draft in plain language. EC's counsel must review before launch,
// and fill in the retention period.
export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        title="How we protect your information"
        lead="You're trusting us with your ID and personal records. Here's exactly what we do with them."
      />
      <PageBody>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, phone number, email and addresses.</li>
          <li>A photo of your government ID.</li>
          <li>The documents you upload to show where you&rsquo;ve lived.</li>
        </ul>

        <h2>What we use it for</h2>
        <p>
          Only to decide whether you&rsquo;re eligible for the Community Equity Endowment and to contact you about it.
          We don&rsquo;t sell your information or use it for marketing.
        </p>

        <h2>Who can see it</h2>
        <p>
          Only the small CEE review team. They sign in with two-step verification, and every time someone opens one of
          your documents, it&rsquo;s recorded.
        </p>

        <h2>How it&rsquo;s stored</h2>
        <p>
          Your files are encrypted and kept in private storage. They&rsquo;re never sent by email and can&rsquo;t be
          reached through a public link.
        </p>

        <h2>How long we keep it</h2>
        <p>
          {/* CONFIRM with EC */}
          We delete ID photos and documents [X months] after a final decision on your application, unless the law
          requires us to keep them longer.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask to see, correct, or delete your information at any time by contacting the CEE team. Withdrawing
          your application means we can&rsquo;t determine your eligibility.
        </p>
      </PageBody>
    </>
  );
}
