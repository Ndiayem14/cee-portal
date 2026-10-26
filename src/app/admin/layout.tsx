import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Staff review", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-bark">
      <header className="bg-oak text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo inverted />
            <span className="hidden rounded-full bg-white/15 px-3 py-1 text-sm font-bold sm:inline">Staff review</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-full border-2 border-white/40 px-4 py-2 font-bold hover:border-white">Sign out</button>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
