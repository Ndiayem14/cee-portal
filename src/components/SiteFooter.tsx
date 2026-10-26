import Link from "next/link";
import { PROGRAM } from "@/config/program";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-oak text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-sm text-white/80">
            A program of Emerson Collective and community partners, created as part of the Sycamore &amp; Oak
            development in Congress Heights.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Talk to a person</h2>
          <ul className="mt-3 space-y-1.5 text-white/85">
            <li>
              Call{" "}
              <a className="underline" href={`tel:${PROGRAM.contact.phone.replace(/\D/g, "")}`}>
                {PROGRAM.contact.phone}
              </a>
            </li>
            <li>
              Email{" "}
              <a className="underline" href={`mailto:${PROGRAM.contact.email}`}>
                {PROGRAM.contact.email}
              </a>
            </li>
            <li>{PROGRAM.contact.inPerson}</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">More</h2>
          <ul className="mt-3 space-y-1.5 text-white/85">
            <li><Link className="underline" href="/faq">Questions and answers</Link></li>
            <li><Link className="underline" href="/help">Get help applying</Link></li>
            <li><Link className="underline" href="/privacy">How we protect your information</Link></li>
            <li><Link className="underline" href="/admin">Staff sign in</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
