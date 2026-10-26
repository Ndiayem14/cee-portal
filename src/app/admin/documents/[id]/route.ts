import { NextResponse, type NextRequest } from "next/server";
import { audit, requireStaff } from "@/lib/staff";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/env";

/**
 * Opens a document for a reviewer: logs the view, then redirects to a
 * signed link that expires after 60 seconds. Documents never have public URLs.
 */
export async function GET(_req: NextRequest, { params }: RouteContext<"/admin/documents/[id]">) {
  const { id } = await params;
  const ctx = await requireStaff("/admin");
  if (!ctx) return new NextResponse("Staff access required", { status: 403 });

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("id, application_id, storage_path, file_name")
    .eq("id", id)
    .single();
  if (!doc) return new NextResponse("Document not found", { status: 404 });

  const { data: signed, error } = await ctx.supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storage_path, 60);
  if (error || !signed) return new NextResponse("Couldn't open the document", { status: 500 });

  await audit(ctx, "view_document", doc.application_id, { documentId: doc.id, detail: { file: doc.file_name } });

  const res = NextResponse.redirect(signed.signedUrl, { status: 303 });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
