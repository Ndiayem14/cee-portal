"use client";

import { PROGRAM } from "@/config/program";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/env";
import type { DocumentRow } from "@/lib/types";

const ALLOWED = PROGRAM.uploads.accept.split(",");

export function checkFile(file: File): string | null {
  if (file.size > PROGRAM.uploads.maxBytes) return "That file is over 10 MB. Try a smaller photo or a PDF.";
  if (file.type && !ALLOWED.includes(file.type)) return "Upload a photo (JPG, PNG, HEIC) or a PDF.";
  return null;
}

/** Uploads to the private bucket under <user>/<application>/ and records it. */
export async function uploadDocument(opts: {
  userId: string;
  applicationId: string;
  file: File;
  kind: DocumentRow["kind"];
  docType?: string | null;
  documentDate?: string | null;
  addressId?: string | null;
}): Promise<{ doc?: DocumentRow; error?: string }> {
  const problem = checkFile(opts.file);
  if (problem) return { error: problem };

  const supabase = createClient();
  const safeName = opts.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
  const path = `${opts.userId}/${opts.applicationId}/${crypto.randomUUID()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, opts.file, { contentType: opts.file.type || undefined, upsert: false });
  if (upErr) return { error: "The upload didn't go through. Check your connection and try again." };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      application_id: opts.applicationId,
      kind: opts.kind,
      doc_type: opts.docType ?? null,
      document_date: opts.documentDate ?? null,
      address_id: opts.addressId ?? null,
      storage_path: path,
      file_name: opts.file.name,
      size_bytes: opts.file.size,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return { error: "We couldn't save that document. Try again." };
  }
  return { doc: data as DocumentRow };
}

export async function deleteDocument(doc: DocumentRow): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) return false;
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);
  return true;
}
