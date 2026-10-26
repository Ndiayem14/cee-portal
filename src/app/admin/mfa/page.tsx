"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";
import { Callout, Field } from "@/components/ui";

/** Staff two-step verification with an authenticator app (TOTP). Required before any review access. */
function Mfa() {
  const supabase = createClient();
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return setError("Sign in first, then come back to this page.");
      const verified = data.totp.find((f: { id: string; status: string }) => f.status === "verified");
      if (verified) return setFactorId(verified.id);

      // Clean up half-finished enrollments, then start a new one.
      for (const f of data.all.filter((f: { id: string; status: string }) => f.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const enroll = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "CEE staff" });
      if (enroll.error) return setError("Couldn't start setup. Refresh to try again.");
      setFactorId(enroll.data.id);
      setQr(enroll.data.totp.qr_code);
      setSecret(enroll.data.totp.secret);
    })();
  }, [supabase]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setError("That code didn't match. Codes change every 30 seconds; try the newest one.");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8">
      <h1 className="text-3xl font-extrabold text-oak">Two-step verification</h1>
      {qr ? (
        <>
          <p className="mt-3 text-muted">
            Staff accounts need an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password).
            Scan this code with the app, then enter the 6-digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for your authenticator app" className="mx-auto mt-5 size-48" />
          {secret && (
            <p className="mt-2 break-all text-center text-sm text-muted">
              Can&rsquo;t scan? Enter this key: <code className="font-bold text-ink">{secret}</code>
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-muted">Enter the 6-digit code from your authenticator app.</p>
      )}
      <form onSubmit={verify} className="mt-6 space-y-4">
        <Field label="Code">
          <input
            className="input text-center font-display text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        {error && <Callout tone="error">{error}</Callout>}
        <button className="btn btn-primary w-full" disabled={busy || code.length !== 6 || !factorId}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>
    </div>
  );
}

export default function MfaPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <Mfa />;
}
