"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, CircleCheck, CircleDashed, FileText, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import {
  ID_TYPES,
  LANGUAGES,
  PROGRAM,
  RESIDENCY_DOC_TYPES,
  RESIDENCY_YEARS,
  docTypeLabel,
  isEligibleZip,
} from "@/config/program";
import { createClient } from "@/lib/supabase/client";
import { findGaps, formatMonth, missingYears, toIsoMonth, yearCoverage } from "@/lib/residency";
import type { AddressPeriod, Application, DocumentRow } from "@/lib/types";
import { Callout, Field } from "@/components/ui";
import { YearRibbon } from "@/components/YearRibbon";
import { AddressTimeline } from "@/components/AddressTimeline";
import { deleteDocument, uploadDocument } from "./upload";

export type StepProps = {
  app: Application;
  userId: string;
  addresses: AddressPeriod[];
  setAddresses: React.Dispatch<React.SetStateAction<AddressPeriod[]>>;
  docs: DocumentRow[];
  setDocs: React.Dispatch<React.SetStateAction<DocumentRow[]>>;
  saving: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  next: (patch?: Partial<Application>) => void;
  back?: () => void;
  jump: (step: number) => void;
  submit: (patch: Partial<Application>) => void;
};

const START = PROGRAM.residencyStartYear;
const thisMonth = new Date().toISOString().slice(0, 7);

/* ------------------------------------------------------------------------ */

function StepNav({
  back,
  saving,
  error,
  continueLabel = "Save and continue",
  disabled,
  onContinue,
}: {
  back?: () => void;
  saving: boolean;
  error: string | null;
  continueLabel?: string;
  disabled?: boolean;
  onContinue?: () => void;
}) {
  return (
    <div className="mt-10 space-y-4">
      {error && <Callout tone="error">{error}</Callout>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {back ? (
          <button type="button" className="btn btn-quiet" onClick={back} disabled={saving}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type={onContinue ? "button" : "submit"}
          onClick={onContinue}
          className="btn btn-primary sm:min-w-56"
          disabled={saving || disabled}
        >
          {saving ? "Saving…" : continueLabel}
        </button>
      </div>
    </div>
  );
}

function Choice({
  name,
  value,
  current,
  onChange,
  children,
}: {
  name: string;
  value: string;
  current: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const checked = current === value;
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3",
        checked ? "border-leaf bg-leaf-wash font-bold" : "border-line hover:border-muted",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="size-5 accent-[var(--color-leaf)]"
      />
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 0: quick eligibility check                                           */

export function CheckStep({ app, next, saving, error }: StepProps) {
  const [livesNow, setLivesNow] = useState(app.current_step > 0 ? "yes" : "");
  const [year, setYear] = useState(app.move_in_year ? String(app.move_in_year) : "");
  const [zip, setZip] = useState(app.current_zip ?? "");

  const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);
  const answered = livesNow && year && zip.length >= 5;
  const tooRecent = Number(year) > START;
  const outsideZip = zip.length >= 5 && !isEligibleZip(zip);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next({ current_zip: zip.slice(0, 5), move_in_year: Number(year) });
      }}
      className="space-y-7"
    >
      <p className="text-lg text-muted">Three quick questions before you start. Nothing is uploaded yet.</p>

      <fieldset>
        <legend className="field-label">Do you live in Congress Heights now?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {[
            ["yes", "Yes"],
            ["no", "No"],
            ["unsure", "I'm not sure"],
          ].map(([v, l]) => (
            <Choice key={v} name="livesNow" value={v} current={livesNow} onChange={setLivesNow}>
              {l}
            </Choice>
          ))}
        </div>
      </fieldset>

      <Field label="What year did you move to Congress Heights?" hint="If you moved away and came back, use the year you came back.">
        <select className="input" required value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Choose a year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Your current ZIP code">
        <input
          className="input max-w-48"
          inputMode="numeric"
          autoComplete="postal-code"
          required
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
        />
      </Field>

      {answered && (
        <div className="space-y-3" aria-live="polite">
          {livesNow === "no" && (
            <Callout tone="warn" title="This program is for people who live in Congress Heights now.">
              If you think you still qualify, you can keep going, or <Link className="underline" href="/help">talk to us first</Link>.
            </Callout>
          )}
          {tooRecent && (
            <Callout tone="warn" title={`You need to have lived here since ${START}.`}>
              Moving in after {START} usually means you won&rsquo;t qualify. If you lived here before, moved away, and
              came back, keep going and list every address.
            </Callout>
          )}
          {outsideZip && livesNow !== "no" && (
            <Callout tone="info" title="That ZIP code is outside the usual area.">
              That&rsquo;s OK if you&rsquo;re near the edge of the neighborhood. We&rsquo;ll check your exact address.
            </Callout>
          )}
          {livesNow === "yes" && !tooRecent && !outsideZip && (
            <Callout tone="info" title="You look eligible to apply.">
              Next, we&rsquo;ll ask a few questions about you.
            </Callout>
          )}
        </div>
      )}

      <StepNav saving={saving} error={error} disabled={!answered} continueLabel="Start application" />
    </form>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 1: about you                                                         */

export function AboutStep({ app, next, back, saving, error }: StepProps) {
  const [f, setF] = useState({
    first_name: app.first_name ?? "",
    last_name: app.last_name ?? "",
    phone: app.phone ?? "",
    email: app.email ?? "",
    current_address: app.current_address ?? "",
    current_zip: app.current_zip ?? "",
    preferred_language: app.preferred_language ?? "English",
    preferred_contact: app.preferred_contact ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next({
          ...f,
          current_zip: f.current_zip.slice(0, 5),
          preferred_contact: (f.preferred_contact || null) as Application["preferred_contact"],
        });
      }}
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name">
          <input className="input" required autoComplete="given-name" value={f.first_name} onChange={set("first_name")} />
        </Field>
        <Field label="Last name">
          <input className="input" required autoComplete="family-name" value={f.last_name} onChange={set("last_name")} />
        </Field>
        <Field label="Phone number">
          <input className="input" type="tel" required autoComplete="tel" value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Email address" hint="Optional if you'd rather we text or call.">
          <input className="input" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <Field label="Current home address" hint="Street address and apartment number">
          <input className="input" required autoComplete="street-address" value={f.current_address} onChange={set("current_address")} />
        </Field>
        <Field label="ZIP code">
          <input className="input" required inputMode="numeric" maxLength={5} value={f.current_zip} onChange={set("current_zip")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred language">
          <select className="input" value={f.preferred_language} onChange={set("preferred_language")}>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="How should we contact you?">
          <select className="input" required value={f.preferred_contact} onChange={set("preferred_contact")}>
            <option value="">Choose one</option>
            <option value="text">Text message</option>
            <option value="phone">Phone call</option>
            <option value="email" disabled={!f.email}>
              Email
            </option>
          </select>
        </Field>
      </div>

      <StepNav back={back} saving={saving} error={error} />
    </form>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 2: address history                                                   */

export function AddressStep({ app, addresses, setAddresses, next, back, saving, error, setError }: StepProps) {
  const supabase = createClient();
  const empty = { address: "", in_neighborhood: true, moved_in: "", moved_out: "", current: false };
  const [form, setForm] = useState(
    addresses.length === 0
      ? { ...empty, address: app.current_address ?? "", current: true, moved_in: app.move_in_year ? `${app.move_in_year}-01` : "" }
      : empty,
  );
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busy, setBusy] = useState(false);

  const gaps = findGaps(addresses);
  const hasCurrent = addresses.some((a) => !a.moved_out);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.current && form.moved_out && form.moved_out < form.moved_in) {
      setError("The move-out date needs to be after the move-in date.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from("address_history")
      .insert({
        application_id: app.id,
        address: form.address.trim(),
        in_neighborhood: form.in_neighborhood,
        moved_in: toIsoMonth(form.moved_in),
        moved_out: form.current ? null : toIsoMonth(form.moved_out),
      })
      .select("*")
      .single();
    setBusy(false);
    if (error) {
      setError("That address didn't save. Try again.");
      return;
    }
    setAddresses((list) => [...list, data as AddressPeriod].sort((a, b) => a.moved_in.localeCompare(b.moved_in)));
    setForm(empty);
    setAdding(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("address_history").delete().eq("id", id);
    if (!error) setAddresses((list) => list.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <p className="text-lg text-muted">
        List every place you&rsquo;ve lived since January {START}, starting with where you live now. Rough dates are
        fine.
      </p>

      <AddressTimeline addresses={addresses} />

      {addresses.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {[...addresses].reverse().map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-bold">{a.address}</p>
                <p className="text-muted">
                  {formatMonth(a.moved_in)} to {a.moved_out ? formatMonth(a.moved_out) : "now"}
                  {!a.in_neighborhood && " (outside Congress Heights)"}
                </p>
              </div>
              <button
                type="button"
                className="btn-danger grid size-11 shrink-0 place-items-center rounded-full hover:bg-alert-wash"
                onClick={() => remove(a.id)}
                aria-label={`Remove ${a.address}`}
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {gaps.length > 0 && addresses.length > 0 && (
        <Callout tone="warn" title="Some time isn't covered yet">
          <ul className="list-disc pl-5">
            {gaps.map((g) => (
              <li key={g.from}>
                {formatMonth(g.from)} to {formatMonth(g.to)}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm">Add the address where you lived then, even if it was outside Congress Heights.</p>
        </Callout>
      )}

      {adding ? (
        <form onSubmit={add} className="space-y-5 rounded-2xl border-2 border-leaf bg-white p-5">
          <p className="font-display text-xl font-bold">Add an address</p>
          <Field label="Street address">
            <input
              className="input"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-5 accent-[var(--color-leaf)]"
              checked={form.in_neighborhood}
              onChange={(e) => setForm({ ...form, in_neighborhood: e.target.checked })}
            />
            This address is in Congress Heights
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Moved in" hint="Month and year">
              <input
                className="input"
                type="month"
                required
                max={thisMonth}
                value={form.moved_in}
                onChange={(e) => setForm({ ...form, moved_in: e.target.value })}
              />
            </Field>
            <Field label="Moved out" hint="Month and year">
              <input
                className="input"
                type="month"
                required={!form.current}
                disabled={form.current}
                max={thisMonth}
                value={form.current ? "" : form.moved_out}
                onChange={(e) => setForm({ ...form, moved_out: e.target.value })}
              />
            </Field>
          </div>
          {!hasCurrent && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="size-5 accent-[var(--color-leaf)]"
                checked={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.checked })}
              />
              I still live here
            </label>
          )}
          <div className="flex gap-3">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Adding…" : "Add address"}
            </button>
            {addresses.length > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => setAdding(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-quiet w-full" onClick={() => setAdding(true)}>
          Add another address
        </button>
      )}

      <StepNav
        back={back}
        saving={saving}
        error={error}
        disabled={!hasCurrent || adding}
        onContinue={() => next()}
      />
      {!hasCurrent && addresses.length > 0 && (
        <p className="text-sm text-muted">Add the address where you live now to continue.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 3: residency documents                                               */

export function DocumentsStep({ app, userId, addresses, docs, setDocs, next, back, saving, error }: StepProps) {
  const residency = docs.filter((d) => d.kind === "residency");
  const coverage = yearCoverage(residency);
  const missing = missingYears(residency);

  const [docType, setDocType] = useState("");
  const [docMonth, setDocMonth] = useState("");
  const [addressId, setAddressId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [note, setNote] = useState(app.household_note ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    const { doc, error } = await uploadDocument({
      userId,
      applicationId: app.id,
      file,
      kind: "residency",
      docType,
      documentDate: toIsoMonth(docMonth),
      addressId: addressId || null,
    });
    setBusy(false);
    if (error || !doc) {
      setUploadError(error ?? "Upload failed.");
      return;
    }
    setDocs((d) => [...d, doc]);
    setFile(null);
    setDocMonth("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(doc: DocumentRow) {
    if (await deleteDocument(doc)) setDocs((d) => d.filter((x) => x.id !== doc.id));
  }

  const byYear = RESIDENCY_YEARS.map((y) => ({
    year: y,
    items: residency.filter((d) => d.document_date?.startsWith(String(y))),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-7">
      <p className="text-lg text-muted">
        Upload documents that show your name, your Congress Heights address and a date. Aim for at least one for each
        year from {START} to now.
      </p>

      <div className="rounded-2xl bg-white p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-lg font-bold text-oak">Years covered</p>
          <p className="text-muted">
            {RESIDENCY_YEARS.length - missing.length} of {RESIDENCY_YEARS.length}
          </p>
        </div>
        <YearRibbon covered={coverage} />
        {missing.length > 0 && residency.length > 0 && (
          <p className="mt-3 text-muted">Still needed: {missing.join(", ")}</p>
        )}
      </div>

      <form onSubmit={upload} className="space-y-5 rounded-2xl border-2 border-leaf bg-white p-5">
        <p className="font-display text-xl font-bold">Add a document</p>
        <Field label="What kind of document is it?">
          <select className="input" required value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="">Choose one</option>
            {["Household or utility records", "Official or institutional records"].map((group) => (
              <optgroup key={group} label={group}>
                {RESIDENCY_DOC_TYPES.filter((d) => d.group === group).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date on the document" hint="Month and year">
            <input
              className="input"
              type="month"
              required
              min={`${START}-01`}
              max={thisMonth}
              value={docMonth}
              onChange={(e) => setDocMonth(e.target.value)}
            />
          </Field>
          <Field label="Which address does it show?">
            <select className="input" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
              <option value="">Choose an address</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.address}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <FilePicker inputRef={fileRef} file={file} onFile={setFile} />

        {uploadError && <Callout tone="error">{uploadError}</Callout>}
        <button className="btn btn-primary" disabled={busy || !file || !docType || !docMonth}>
          {busy ? "Uploading…" : "Upload document"}
        </button>
      </form>

      {byYear.length > 0 && (
        <div>
          <h2 className="text-xl font-bold">Your documents</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {byYear.flatMap(({ items }) =>
              items.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 shrink-0 text-leaf" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-bold">
                        {docTypeLabel(d.doc_type)}, {formatMonth(d.document_date)}
                      </p>
                      <p className="truncate text-sm text-muted">{d.file_name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-danger grid size-11 shrink-0 place-items-center rounded-full hover:bg-alert-wash"
                    onClick={() => remove(d)}
                    aria-label={`Remove ${d.file_name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <Field
        label="Are any documents in someone else's name?"
        hint="Optional. For example: “The bills are in my mother's name. I've lived with her at this address since 2012.”"
      >
        <textarea className="input min-h-28" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <Callout tone="info">
        Can&rsquo;t find documents for some years? Continue anyway and we&rsquo;ll follow up, or{" "}
        <Link className="underline" href="/help">talk to us about other options</Link>.
      </Callout>

      <StepNav
        back={back}
        saving={saving}
        error={error}
        disabled={residency.length === 0}
        onContinue={() => next({ household_note: note.trim() || null })}
      />
    </div>
  );
}

function FilePicker({
  inputRef,
  file,
  onFile,
  label = "Choose a photo or file",
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  onFile: (f: File | null) => void;
  label?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-line bg-bark p-4 hover:border-leaf">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-leaf">
        <Camera aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-bold">{file ? file.name : label}</span>
        <span className="block text-sm text-muted">
          {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Take a photo or pick a PDF. Up to 10 MB."}
        </span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={PROGRAM.uploads.accept}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 4: photo ID                                                          */

export function IdStep({ app, userId, docs, setDocs, next, back, saving, error }: StepProps) {
  const [idType, setIdType] = useState(app.id_type ?? "");
  const front = docs.find((d) => d.kind === "id_front");
  const back_ = docs.find((d) => d.kind === "id_back");

  return (
    <div className="space-y-7">
      <p className="text-lg text-muted">
        Upload one government photo ID. Make sure all four corners are in the photo and the words are easy to read.
      </p>

      <Field label="Which ID are you using?">
        <select className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>
          <option value="">Choose one</option>
          {ID_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <IdSlot title="Front" kind="id_front" existing={front} app={app} userId={userId} setDocs={setDocs} />
        <IdSlot
          title={idType === "passport" ? "Back (not needed for a passport)" : "Back"}
          kind="id_back"
          existing={back_}
          app={app}
          userId={userId}
          setDocs={setDocs}
        />
      </div>

      <StepNav
        back={back}
        saving={saving}
        error={error}
        disabled={!idType || !front}
        onContinue={() => next({ id_type: idType })}
      />
    </div>
  );
}

function IdSlot({
  title,
  kind,
  existing,
  app,
  userId,
  setDocs,
}: {
  title: string;
  kind: "id_front" | "id_back";
  existing?: DocumentRow;
  app: Application;
  userId: string;
  setDocs: StepProps["setDocs"];
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    if (existing) {
      await deleteDocument(existing);
      setDocs((d) => d.filter((x) => x.id !== existing.id));
    }
    const { doc, error } = await uploadDocument({ userId, applicationId: app.id, file, kind, docType: app.id_type });
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (error || !doc) return setErr(error ?? "Upload failed.");
    setDocs((d) => [...d, doc]);
  }

  return (
    <div className={clsx("rounded-2xl border-2 bg-white p-4", existing ? "border-leaf" : "border-line")}>
      <p className="flex items-center gap-2 font-bold">
        {existing ? <CircleCheck className="text-leaf" size={20} aria-hidden /> : <CircleDashed className="text-muted" size={20} aria-hidden />}
        {title}
      </p>
      {existing && <p className="mt-1 truncate text-sm text-muted">{existing.file_name}</p>}
      <div className="mt-3">
        {busy ? (
          <p className="text-muted">Uploading…</p>
        ) : (
          <FilePicker inputRef={ref} file={null} onFile={onFile} label={existing ? "Replace photo" : "Add photo"} />
        )}
      </div>
      {err && <p className="mt-2 text-alert">{err}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Step 5: review, attest and sign                                           */

export function ReviewStep({ app, addresses, docs, back, jump, submit, saving, error }: StepProps) {
  const [attested, setAttested] = useState(app.attested);
  const [consented, setConsented] = useState(app.consented);
  const [signature, setSignature] = useState(app.signature_name ?? "");
  const [helper, setHelper] = useState(app.helper_name ?? "");

  const residency = docs.filter((d) => d.kind === "residency");
  const missing = missingYears(residency);
  const gaps = findGaps(addresses);
  const hasId = docs.some((d) => d.kind === "id_front");
  const resubmitting = app.status === "needs_info";

  const checks = [
    { ok: !!(app.first_name && app.last_name && app.current_address), label: "Your contact details", step: 1 },
    { ok: gaps.length === 0, label: `Addresses cover ${START} to now`, step: 2 },
    {
      ok: missing.length === 0,
      label: missing.length ? `Documents for every year (missing ${missing.join(", ")})` : "Documents for every year",
      step: 3,
    },
    { ok: hasId, label: "Photo ID", step: 4 },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          attested,
          consented,
          signature_name: signature.trim(),
          helper_name: helper.trim() || null,
        });
      }}
      className="space-y-8"
    >
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-4 p-4">
            <span className="flex items-start gap-3">
              {c.ok ? (
                <CircleCheck className="mt-0.5 shrink-0 text-leaf" aria-label="Complete" />
              ) : (
                <CircleDashed className="mt-0.5 shrink-0 text-sun" aria-label="Incomplete" />
              )}
              {c.label}
            </span>
            <button type="button" className="flex shrink-0 items-center gap-1 font-bold text-leaf underline" onClick={() => jump(c.step)}>
              <Pencil size={16} aria-hidden /> Edit
            </button>
          </li>
        ))}
      </ul>

      {checks.some((c) => !c.ok) && (
        <Callout tone="warn">
          You can still submit. We&rsquo;ll contact you if we need anything else.
        </Callout>
      )}

      <dl className="grid gap-x-8 gap-y-3 rounded-2xl bg-white p-5 sm:grid-cols-2">
        {[
          ["Name", `${app.first_name ?? ""} ${app.last_name ?? ""}`],
          ["Phone", app.phone],
          ["Email", app.email || "None"],
          ["Address", `${app.current_address ?? ""} ${app.current_zip ?? ""}`],
          ["Addresses listed", String(addresses.length)],
          ["Documents uploaded", String(docs.length)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <Field label="Did someone help you fill this out?" hint="Optional. Their name and organization, if any.">
        <input className="input" value={helper} onChange={(e) => setHelper(e.target.value)} />
      </Field>

      <fieldset className="space-y-4 rounded-2xl border-2 border-oak bg-white p-5">
        <legend className="px-2 font-display text-xl font-bold text-oak">Your signature</legend>
        <label className="flex gap-3">
          <input
            type="checkbox"
            required
            className="mt-1 size-5 shrink-0 accent-[var(--color-leaf)]"
            checked={attested}
            onChange={(e) => setAttested(e.target.checked)}
          />
          <span>
            I certify that the information provided in this application is true and accurate to the best of my
            knowledge. I understand that the information and documents submitted will be used to determine my
            eligibility for the Community Equity Endowment.
          </span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            required
            className="mt-1 size-5 shrink-0 accent-[var(--color-leaf)]"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
          />
          <span>
            I agree that the CEE team may store and review my information and documents as described in{" "}
            <Link href="/privacy" target="_blank" className="font-bold text-leaf underline">
              how we protect your information
            </Link>
            , and may contact me about my application.
          </span>
        </label>
        <Field label="Type your full name to sign">
          <input
            className="input font-display text-xl"
            required
            autoComplete="name"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </Field>
      </fieldset>

      <StepNav
        back={back}
        saving={saving}
        error={error}
        disabled={!attested || !consented || !signature.trim()}
        continueLabel={resubmitting ? "Send my update" : "Submit application"}
      />
    </form>
  );
}
