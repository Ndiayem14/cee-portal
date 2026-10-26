# Community Equity Endowment: resident portal

Website and application portal for the Sycamore & Oak Community Equity Endowment (Emerson Collective).
Long-time Congress Heights residents learn about the program and apply; the CEE team reviews applications.

**Stack:** Next.js 16 (App Router) · Supabase (database, sign-in, private file storage) · Tailwind CSS 4 · deployed on Vercel.

## What's in it

**Public pages**: Home, Sycamore & Oak, What is a Community Equity Endowment, Community Advisory Board,
Benefit (blank, as requested), FAQ, Get help, Privacy.

**Applicant portal**
- Sign in with a one-time code by email (or text, if enabled). No passwords.
- Quick eligibility check before anything is uploaded.
- Six-step application that saves as you go: about you → address history → residency documents → photo ID → review and sign.
- Address timeline that flags gaps in the residency window.
- "Years covered" ribbon showing which years still need a document.
- Phone-camera uploads (JPG, PNG, HEIC, PDF, up to 10 MB).
- My application page with status, confirmation number and any requests from staff.

**Staff review** (`/admin`)
- Two-step verification (authenticator app) required for every staff account.
- Queue with status filters, search, years-covered bar, and flags for possible duplicates, out-of-area ZIPs and missing ID.
- Application view: address timeline, documents by year, automatic checklist, team notes,
  "ask for more" requests, and eligible / not-eligible decisions with reasons.
- Documents open through 60-second signed links; every view is logged. Admins see the activity log.
- CSV export of contact details by status (no document links).

## Security model

- Row Level Security on every table. Applicants only ever see their own data.
- Staff must have the `reviewer` or `admin` role **and** be signed in with two-step verification; the database enforces this, not just the app.
- Applicants can't change review fields or approve themselves (database trigger). Once submitted, an application is locked until staff ask for more information.
- Files live in a private bucket under `<user id>/<application id>/`. No public URLs.
- The app never uses the Supabase service-role key.
- `supabase/tests/rls_test.py` checks all of the above (42 checks).

## Set up

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com). Choose a US region. Use a paid plan for real data (backups).
2. **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
3. **Authentication → Sign In / Providers**: Email enabled. Turn off "Confirm email" (the code itself confirms it).
4. **Authentication → Email Templates**: in both **Magic Link** and **Confirm signup**, make the email show the code
   instead of a link, e.g. `Your Community Equity Endowment sign-in code is {{ .Token }}`
5. **Authentication → Multi-Factor**: enable TOTP (authenticator app).
6. **Authentication → SMTP**: connect a real email sender (e.g. Resend) before launch. Supabase's built-in sender is rate-limited.
7. Optional, text-message sign-in: set up Twilio under **Authentication → Providers → Phone**, then set `NEXT_PUBLIC_ENABLE_SMS_LOGIN=true`.

### 2. Run locally
```bash
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:3000
```

### 3. Make yourself staff
Sign in once through the site, then in the Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.org';
```
Go to `/admin`. You'll be asked to set up an authenticator app. Use `reviewer` for other team members.

### 4. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project** → import the repo.
3. Add the environment variables from `.env.example`.
4. Deploy. In Supabase → **Authentication → URL Configuration**, set the Site URL to your Vercel domain.

## Before launch: decisions for EC

These are marked `CONFIRM` in the code. Most live in `src/config/program.ts`.

| Question | Where | Current setting |
|---|---|---|
| Residency window: "since 2017" vs. "10 years" | `program.ts` | 10 calendar years, 2017–2026 |
| Congress Heights boundary | `program.ts` | ZIP 20032 (replace with a map boundary) |
| CEE phone, email, in-person help | `program.ts` | Placeholders |
| Age requirement; one application per adult | Home, FAQ | 18+, each adult applies |
| How long documents are kept | `/privacy` | "[X months]" |
| Advisory Board members and meetings | `/community-advisory-board` | Placeholder |
| Benefit details | `/benefit` | Blank |
| Privacy wording | `/privacy` | Draft, needs counsel review |

## Project map
```
src/config/program.ts        program settings (dates, ZIPs, contacts, document types)
src/app/(site)/              public pages, sign-in, application, my-application
src/app/(site)/apply/        application steps, uploads, submit action
src/app/admin/               staff queue, application view, actions, document viewer, CSV export
src/lib/residency.ts         address gaps and year coverage
src/lib/review.ts            reviewer checklist and duplicate detection
src/lib/staff.ts             staff access check (role + 2FA) and audit logging
src/proxy.ts                 refreshes sessions, sends signed-out users to /login
supabase/migrations/         database schema and security rules
supabase/tests/              database security tests
```

## Testing the database rules
Needs a local Postgres 15+ and `pip install "psycopg[binary]"`:
```bash
createdb cee_test
psql -d cee_test -f supabase/tests/00_mock_supabase.sql
psql -d cee_test -f supabase/migrations/0001_init.sql
TEST_DATABASE_URL="dbname=cee_test" python3 supabase/tests/rls_test.py
```

## Phase 2 ideas
Spanish and Amharic translations · text-message status updates (Twilio) · automated ID checks (Persona or Stripe Identity) ·
map-based boundary check · staff "assisted application" mode · document retention job · the Benefit section.
