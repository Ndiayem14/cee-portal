import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Atkinson Hyperlegible was designed for low-vision readers: every letter is easy to tell apart.
const body = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../fonts/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const heading = localFont({
  variable: "--font-heading",
  display: "swap",
  src: [{ path: "../fonts/bricolage-grotesque-variable.woff2", weight: "200 800", style: "normal" }],
});

export const metadata: Metadata = {
  title: {
    default: "Community Equity Endowment | Sycamore & Oak",
    template: "%s | Community Equity Endowment",
  },
  description:
    "Learn about the Sycamore & Oak Community Equity Endowment and apply as a long-time Congress Heights resident.",
};

export const viewport: Viewport = {
  themeColor: "#17402f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
