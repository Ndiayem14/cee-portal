"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { AddressPeriod, Application, DocumentRow, InfoRequest } from "@/lib/types";
import { Callout } from "@/components/ui";
import { submitApplication } from "./actions";
import {
  AboutStep,
  AddressStep,
  CheckStep,
  DocumentsStep,
  IdStep,
  ReviewStep,
  type StepProps,
} from "./steps";

const STEPS = [
  { title: "Check", heading: "Let's see if you qualify", Component: CheckStep },
  { title: "About you", heading: "About you", Component: AboutStep },
  { title: "Addresses", heading: "Where you've lived", Component: AddressStep },
  { title: "Documents", heading: "Proof of where you've lived", Component: DocumentsStep },
  { title: "Photo ID", heading: "Your photo ID", Component: IdStep },
  { title: "Review", heading: "Review and sign", Component: ReviewStep },
] as const;

export function ApplyWizard() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [addresses, setAddresses] = useState<AddressPeriod[]>([]);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [step, setStep] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Load (or create) the applicant's application.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/apply");
        return;
      }
      setUserId(user.id);

      let { data: existing } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle();
      if (!existing) {
        const { data: created, error } = await supabase
          .from("applications")
          .insert({ user_id: user.id, email: user.email ?? null, phone: user.phone ? `+${user.phone}` : null })
          .select("*")
          .single();
        if (error) {
          setLoadError("We couldn't start your application. Refresh the page to try again.");
          return;
        }
        existing = created;
      }
      const a = existing as Application;
      if (!["draft", "needs_info"].includes(a.status)) {
        router.replace("/my-application");
        return;
      }

      const [addr, d, r] = await Promise.all([
        supabase.from("address_history").select("*").eq("application_id", a.id).order("moved_in"),
        supabase.from("documents").select("*").eq("application_id", a.id).order("created_at"),
        supabase.from("info_requests").select("*").eq("application_id", a.id).is("resolved_at", null),
      ]);
      setApp(a);
      setAddresses((addr.data ?? []) as AddressPeriod[]);
      setDocs((d.data ?? []) as DocumentRow[]);
      setRequests((r.data ?? []) as InfoRequest[]);
      setStep(a.status === "needs_info" ? 3 : Math.min(a.current_step ?? 0, STEPS.length - 1));
    })();
  }, [supabase, router]);

  const save = useCallback(
    async (patch: Partial<Application>) => {
      if (!app) return false;
      const { data, error } = await supabase.from("applications").update(patch).eq("id", app.id).select("*").single();
      if (error) {
        setStepError("Your changes didn't save. Check your connection and try again.");
        return false;
      }
      setApp(data as Application);
      return true;
    },
    [app, supabase],
  );

  async function goTo(next: number, patch: Partial<Application> = {}) {
    setSaving(true);
    setStepError(null);
    const ok = await save({ ...patch, current_step: Math.max(next, app?.current_step ?? 0) });
    setSaving(false);
    if (ok) {
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit(patch: Partial<Application>) {
    setSaving(true);
    setStepError(null);
    const ok = await save(patch);
    if (!ok) {
      setSaving(false);
      return;
    }
    const result = await submitApplication();
    setSaving(false);
    if (!result.ok) {
      setStepError(result.error);
      return;
    }
    router.replace("/my-application?submitted=1");
    router.refresh();
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <Callout tone="error" title="Something went wrong">{loadError}</Callout>
      </div>
    );
  }

  if (!app || !userId) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted">Loading your application…</div>;
  }

  const { heading, Component } = STEPS[step];
  const props: StepProps = {
    app,
    userId,
    addresses,
    setAddresses,
    docs,
    setDocs,
    saving,
    error: stepError,
    setError: setStepError,
    next: (patch) => goTo(step + 1, patch),
    back: step > 0 ? () => goTo(step - 1) : undefined,
    jump: (i) => goTo(i),
    submit,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6">
      {/* Progress */}
      <nav aria-label="Application steps">
        <ol className="grid grid-cols-6 gap-1.5">
          {STEPS.map((s, i) => {
            const reached = i <= Math.max(app.current_step, step);
            return (
              <li key={s.title}>
                <button
                  type="button"
                  disabled={!reached || saving}
                  onClick={() => goTo(i)}
                  aria-current={i === step ? "step" : undefined}
                  className="group w-full text-left disabled:cursor-default"
                >
                  <span
                    className={clsx(
                      "block h-2 rounded-full",
                      i < step ? "bg-leaf" : i === step ? "bg-oak" : reached ? "bg-leaf/40" : "bg-bark-deep",
                    )}
                  />
                  <span
                    className={clsx(
                      "mt-1.5 hidden items-center gap-1 text-sm sm:flex",
                      i === step ? "font-bold text-oak" : "text-muted",
                    )}
                  >
                    {i < step && <Check size={14} aria-hidden />}
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-sm text-muted sm:hidden">
          Step {step + 1} of {STEPS.length}: {STEPS[step].title}
        </p>
      </nav>

      {requests.length > 0 && (
        <div className="mt-6">
          <Callout tone="warn" title="We need a bit more from you">
            {requests.map((r) => (
              <p key={r.id} className="whitespace-pre-line">{r.message}</p>
            ))}
            <p className="mt-2 text-sm">Make your changes, then send your update from the Review step.</p>
          </Callout>
        </div>
      )}

      <h1 className="mt-8 text-3xl font-extrabold text-oak sm:text-4xl">{heading}</h1>
      <div className="mt-6">
        <Component {...props} />
      </div>

      <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
        Your progress saves each time you continue. You can close this page and come back later.
      </p>
    </div>
  );
}
