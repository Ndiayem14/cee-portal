import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { PROGRAM } from "@/config/program";

export const metadata: Metadata = { title: "Get help" };

export default function HelpPage() {
  const { phone, email, inPerson, hours } = PROGRAM.contact;
  return (
    <>
      <PageIntro
        title="Get help applying"
        lead="You don't have to do this alone. Reach us whichever way is easiest for you."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          <li className="bg-white p-6">
            <Phone className="text-leaf" size={28} aria-hidden />
            <h2 className="mt-3 text-xl font-bold">Call or text</h2>
            <a className="mt-1 block text-lg font-bold text-oak underline" href={`tel:${phone.replace(/\D/g, "")}`}>
              {phone}
            </a>
            <p className="mt-1 text-muted">Leave a message and we&rsquo;ll call you back within two business days.</p>
          </li>
          <li className="bg-white p-6">
            <Mail className="text-leaf" size={28} aria-hidden />
            <h2 className="mt-3 text-xl font-bold">Email</h2>
            <a className="mt-1 block text-lg font-bold text-oak underline" href={`mailto:${email}`}>
              {email}
            </a>
            <p className="mt-1 text-muted">Don&rsquo;t email photos of your ID or documents. Upload them in the application instead.</p>
          </li>
          <li className="bg-white p-6">
            <MapPin className="text-leaf" size={28} aria-hidden />
            <h2 className="mt-3 text-xl font-bold">In person</h2>
            <p className="mt-1 font-bold">{inPerson}</p>
            <p className="mt-1 text-muted">{hours} Bring your ID and any documents you have; we can scan them for you.</p>
          </li>
        </ul>

        <div className="prose-cee mt-12">
          <h2>If you don&rsquo;t have the usual documents</h2>
          <p>
            Some people don&rsquo;t have bills in their name, lost old records, or moved in with family. That&rsquo;s
            common. Contact us before you give up: we can talk through other ways to show where you&rsquo;ve lived.
          </p>

          <h2>If someone is helping you</h2>
          <p>
            A family member, friend or community partner can help you fill out the application on your phone or
            theirs. Sign in with your own phone number or email so the application stays yours. There&rsquo;s a place
            in the form to tell us who helped.
          </p>

          <h2>Watch out for scams</h2>
          <p>
            Applying is free. We will never ask you to pay a fee, give a bank password, or buy a gift card. If anyone
            does, don&rsquo;t respond, and let us know.
          </p>
        </div>
      </div>
    </>
  );
}
