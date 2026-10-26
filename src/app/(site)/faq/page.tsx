import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { PROGRAM } from "@/config/program";

export const metadata: Metadata = { title: "Questions and answers" };

const start = PROGRAM.residencyStartYear;

// CONTENT: review with EC, especially answers marked CONFIRM.
const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Who can apply?",
    a: `Adults who live in Congress Heights now and have lived in Congress Heights since ${start}. Moving between homes inside the neighborhood is fine.`,
  },
  {
    q: "Does it cost anything to apply?",
    a: "No. Applying is free. No one from the program will ever ask you to pay to apply or to receive a benefit.",
  },
  {
    q: "What documents count as proof of where I lived?",
    a: (
      <>
        Bills (electric, gas, water, phone or internet), insurance statements, tax records, school enrollment records,
        DC benefits letters, leases or other housing records. Each one needs your name, your address and a date. The{" "}
        <Link className="underline" href="/apply">application</Link> shows which years you still need.
      </>
    ),
  },
  {
    q: "Do I need a document for every single year?",
    a: `Your documents together need to show you lived in Congress Heights from ${start} to now. One document per year is the easiest way. If you're missing a year, upload what you have and we'll tell you if we need more.`,
  },
  {
    q: "The bills aren't in my name. Can I still apply?",
    a: "Yes. Upload the documents you have and tell us how you're connected to the household, for example if the bills are in a parent's or partner's name. We may ask for one more document that shows your name at the address.",
  },
  {
    q: "What if I don't have any of these documents?",
    a: (
      <>
        Contact us. We can talk through other ways to show where you&rsquo;ve lived.{" "}
        <Link className="underline" href="/help">See how to reach us</Link>.
      </>
    ),
  },
  {
    q: "Can I take photos with my phone?",
    a: "Yes. Make sure the whole page is in the photo and the words are easy to read.",
  },
  {
    q: "Can someone help me fill this out?",
    a: (
      <>
        Yes. A family member, friend or community partner can help. There&rsquo;s a place in the form to tell us who
        helped. You can also get help in person; <Link className="underline" href="/help">see times and places</Link>.
      </>
    ),
  },
  {
    q: "Does everyone in my household apply together?",
    // CONFIRM with EC
    a: "No. Each adult applies on their own, with their own ID. You can use the same household documents if they show your connection to the home.",
  },
  {
    q: "What happens after I submit?",
    a: "Our team reviews every application by hand. You can check your status any time on the My application page. If we need anything else, we'll text or email you and tell you exactly what's missing.",
  },
  {
    q: "Who sees my documents?",
    a: (
      <>
        Only the small CEE review team. Your files are stored privately and encrypted, and every time a reviewer opens
        one it&rsquo;s recorded. <Link className="underline" href="/privacy">Read how we protect your information</Link>.
      </>
    ),
  },
  {
    q: "What is the benefit, and when will I get it?",
    // CONFIRM with EC
    a: (
      <>
        Details are still being finalized. We&rsquo;ll post them on the <Link className="underline" href="/benefit">Benefit page</Link> and
        let applicants know.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <PageIntro title="Questions and answers" lead="The things people ask most about applying." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-bold">
                {q}
                <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-5 pb-5 text-ink/85">{a}</div>
            </details>
          ))}
        </div>
        <p className="mt-8 text-muted">
          Still have a question? <Link className="underline" href="/help">Get in touch</Link>.
        </p>
      </div>
    </>
  );
}
