"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";

const SMS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SMS_LOGIN === "true";

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/apply";

  const [method, setMethod] = useState<"email" | "phone">(SMS_ENABLED ? "phone" : "email");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter" | "verify">("enter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link"
      ? "That sign-in link has expired or was opened in a different browser. Send yourself a new one."
      : null,
  );

  const supabase = createClient();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      method === "email"
        ? await supabase.auth.signInWithOtp({
            email: value.trim(),
            options: {
              shouldCreateUser: true,
              emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
            },
          })
        : await supabase.auth.signInWithOtp({ phone: toE164(value), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) {
      setError(
        method === "email"
          ? "We couldn't send a code to that email. Check the address and try again."
          : "We couldn't text that number. Check it and try again, or use email instead.",
      );
      return;
    }
    setStage("verify");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      method === "email"
        ? await supabase.auth.verifyOtp({ email: value.trim(), token: code.trim(), type: "email" })
        : await supabase.auth.verifyOtp({ phone: toE164(value), token: code.trim(), type: "sms" });
    setBusy(false);
    if (error) {
      setError("That code didn't work. Codes expire after an hour; send a new one if needed.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-oak">Sign in</h1>
      <p className="mt-3 text-lg text-muted">
        No password needed. We&rsquo;ll send you a sign-in email. New here? This also creates your account.
      </p>

      {stage === "enter" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-5">
          {SMS_ENABLED && (
            <div role="radiogroup" aria-label="Get the code by" className="grid grid-cols-2 gap-2 rounded-full bg-bark-deep p-1">
              {(["phone", "email"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  onClick={() => {
                    setMethod(m);
                    setValue("");
                  }}
                  className={`rounded-full py-2.5 font-bold ${method === m ? "bg-white text-oak shadow-sm" : "text-muted"}`}
                >
                  {m === "phone" ? "Text me" : "Email me"}
                </button>
              ))}
            </div>
          )}
          <label className="block">
            <span className="field-label">{method === "email" ? "Email address" : "Mobile phone number"}</span>
            <input
              className="input"
              type={method === "email" ? "email" : "tel"}
              autoComplete={method === "email" ? "email" : "tel"}
              inputMode={method === "email" ? "email" : "tel"}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={method === "email" ? "you@example.com" : "(202) 555-0123"}
            />
          </label>
          {error && <p role="alert" className="rounded-lg bg-alert-wash p-3 text-alert">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !value}>
            {busy ? "Sending…" : method === "email" ? "Email me a sign-in link" : "Text me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-5">
          <p>
            {method === "email" ? (
              <>
                Check your email at <strong>{value}</strong>. Click the sign-in link in the email, or enter the code
                if the email shows one.{" "}
              </>
            ) : (
              <>
                We sent a code to <strong>{value}</strong>.{" "}
              </>
            )}
            <button type="button" className="font-bold text-leaf underline" onClick={() => setStage("enter")}>
              Change
            </button>
          </p>
          <label className="block">
            <span className="field-label">Code from the email</span>
            <input
              className="input text-center font-display text-2xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {error && <p role="alert" className="rounded-lg bg-alert-wash p-3 text-alert">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button type="button" className="btn btn-quiet w-full" disabled={busy} onClick={sendCode}>
            Send again
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
