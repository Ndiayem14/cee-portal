"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";

const NAV = [
  { href: "/sycamore-and-oak", label: "Sycamore & Oak" },
  { href: "/community-equity-endowment", label: "The Endowment" },
  { href: "/community-advisory-board", label: "Advisory Board" },
  { href: "/benefit", label: "Benefit" },
  { href: "/faq", label: "FAQ" },
  { href: "/help", label: "Get help" },
];

export function SiteHeader() {
  // The current path is only known at request time, so it streams in; the fallback is identical minus the highlight.
  return (
    <Suspense fallback={<HeaderView pathname="" />}>
      <LiveHeader />
    </Suspense>
  );
}

function LiveHeader() {
  return <HeaderView pathname={usePathname()} />;
}

function HeaderView({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "whitespace-nowrap rounded-full px-3 py-2 text-[0.95rem] hover:bg-bark",
                    pathname === item.href && "bg-leaf-wash font-bold text-oak",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/my-application" className="hidden whitespace-nowrap px-2 py-2 font-bold text-oak hover:underline sm:block">
            My application
          </Link>
          <Link href="/apply" className="btn btn-primary !min-h-11 !px-5">
            Apply
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border-2 border-line xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line xl:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {[...NAV, { href: "/my-application", label: "My application" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block rounded-lg px-3 py-3 text-lg",
                    pathname === item.href ? "bg-leaf-wash font-bold text-oak" : "hover:bg-bark",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
