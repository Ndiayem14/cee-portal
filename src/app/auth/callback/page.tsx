"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Where the email sign-in link lands. The link carries the session in the URL fragment
 * (#access_token=...), which only the browser can read, so this runs client-side.
 * Works on any device or browser, unlike links tied to the browser that requested them.
 */
export default function AuthCallback() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("next") ?? "/apply";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/apply";
    const hash = new URLSearchParams(url.hash.slice(1));

    // Older link style: hand off to the server route.
    if (url.searchParams.get("code") || url.searchParams.get("token_hash")) {
      window.location.replace(`/auth/confirm${url.search}`);
      return;
    }

    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      setFailed(true);
      window.location.replace(`/login?error=link&next=${encodeURIComponent(next)}`);
      return;
    }

    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }: { error: unknown }) => {
        if (error) {
          setFailed(true);
          window.location.replace(`/login?error=link&next=${encodeURIComponent(next)}`);
        } else {
          window.location.replace(next);
        }
      });
  }, []);

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-bark px-4">
      <p className="text-lg text-muted">{failed ? "That link didn't work. Taking you back…" : "Signing you in…"}</p>
    </main>
  );
}
