import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the sign-in link in the email lands. Supports both link styles Supabase uses:
 * ?code=... (default templates) and ?token_hash=...&type=... (custom templates).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get("next") ?? "/apply";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/apply";

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  const dest = new URL(ok ? next : `/login?error=link&next=${encodeURIComponent(next)}`, request.url);
  return NextResponse.redirect(dest, { status: 303 });
}
