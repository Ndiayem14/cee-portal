import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "Community Advisory Board" };

// CONTENT: placeholder copy. EC to provide the board's role, members and meeting info.
export default function AdvisoryBoardPage() {
  return (
    <>
      <PageIntro
        title="The Community Advisory Board"
        lead="Neighbors who help make sure the endowment works for the people of Congress Heights."
      />
      <PageBody>
        <h2>What the board does</h2>
        <ul>
          <li>Brings resident voices into decisions about the endowment.</li>
          <li>Advises on who is eligible and how the benefit is shared.</li>
          <li>Helps spread the word so every eligible neighbor knows they can apply.</li>
          <li>Keeps the program accountable to the community.</li>
        </ul>

        <h2>Members</h2>
        <p>Board members will be listed here.</p>

        <h2>Meetings</h2>
        <p>
          Meeting dates and how to attend will be posted here. Questions for the board?{" "}
          <Link href="/help">Contact the CEE team</Link> and we&rsquo;ll pass them on.
        </p>

        <h2>Watch</h2>
        <p>
          <a
            href="https://drive.google.com/file/d/1PREsWzfdI0gg7If4l-AlJOFM_zfyWsdf/view"
            target="_blank"
            rel="noreferrer"
          >
            Redefining Development
          </a>
          , a short film from Emerson Collective.
        </p>
      </PageBody>
    </>
  );
}
