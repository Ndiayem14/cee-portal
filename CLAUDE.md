@AGENTS.md

# CEE resident portal: notes for Claude

Read README.md first. This app holds people's government IDs and tax records, so security rules come before convenience.

## Rules
- Never use or add the Supabase service-role key. All queries run as the signed-in user through Row Level Security.
- Any new table: enable RLS and write policies in a new migration in `supabase/migrations/`, then add checks to `supabase/tests/rls_test.py` and run it.
- Staff checks happen in two places: `requireStaff()` in `src/lib/staff.ts` and `public.is_staff()` in SQL (role + aal2). Keep both.
- Documents are only ever opened through `/admin/documents/[id]` (signed 60-second link + audit log). Never create public URLs.
- Never put personal data in URLs, logs, or emails. Emails link back to the portal only.
- Program settings (dates, ZIPs, contact info) live in `src/config/program.ts`. Don't hard-code them in pages.

## Next.js 16 specifics
- `cacheComponents` is on. Anything reading cookies, params or searchParams must be inside `<Suspense>`.
- Request interception lives in `src/proxy.ts` (formerly middleware).
- Run `npm run build` before committing; it catches prerendering errors that `tsc` doesn't.

## Writing and design
- Plain language for residents: short sentences, sentence case, say what a button does ("Upload document", not "Submit").
- Fonts: Atkinson Hyperlegible (body, chosen for low-vision readers), Bricolage Grotesque (headings).
- Colors are tokens in `src/app/globals.css` (oak, leaf, bark, sun). Gold "sun" means "still needed".
- Mobile first: test at 390px wide. Tap targets at least 44px.
