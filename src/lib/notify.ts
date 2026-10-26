import "server-only";

/**
 * Sends an email through Resend when RESEND_API_KEY is set; otherwise logs it.
 * Messages never include document contents or ID details, only a link back to the portal.
 * TODO (phase 2): text messages through Twilio for applicants who prefer texts.
 */
export async function sendEmail({ to, subject, text }: { to: string | null | undefined; subject: string; text: string }) {
  if (!to) return;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Community Equity Endowment <no-reply@example.org>";
  if (!key) {
    console.info(`[notify] (email not configured) to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) console.error(`[notify] Resend error ${res.status}`);
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return `${base}${path}`;
}
