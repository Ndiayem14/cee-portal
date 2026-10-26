-- Community Equity Endowment resident portal: initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- Security model
--  * Every table has Row Level Security on. Applicants only ever see their own rows.
--  * Staff (reviewer/admin) must ALSO be signed in with two-factor (aal2) to see anything.
--  * Documents live in a PRIVATE bucket. Staff view them via 60-second signed links,
--    and every view is written to audit_log.
--  * The app never uses the service-role key.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('applicant', 'reviewer', 'admin');
create type public.application_status as enum
  ('draft', 'submitted', 'under_review', 'needs_info', 'approved', 'denied');
create type public.document_kind as enum ('id_front', 'id_back', 'residency');

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created automatically)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  role public.app_role not null default 'applicant',
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, phone) values (new.id, new.email, new.phone);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Staff = reviewer/admin role AND signed in with two-factor.
create function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('reviewer', 'admin')
  ) and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- Role without the 2FA requirement, so the app can tell staff to finish 2FA setup.
create function public.my_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Applications (one per applicant)
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status public.application_status not null default 'draft',
  current_step int not null default 0,

  first_name text,
  last_name text,
  phone text,
  email text,
  current_address text,
  current_zip text,
  move_in_year int check (move_in_year between 1900 and 2100),
  preferred_language text,
  preferred_contact text check (preferred_contact in ('text', 'email', 'phone')),
  helper_name text,           -- someone who helped fill out the form, if any
  household_note text,        -- explains connection to household when name isn't on bills
  id_type text,

  attested boolean not null default false,
  consented boolean not null default false,
  signature_name text,
  submitted_at timestamptz,

  -- review fields: staff only (enforced by trigger below)
  reviewer_id uuid references auth.users (id),
  decided_at timestamptz,
  decision_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_status_idx on public.applications (status, submitted_at);

-- Guard rails for applicant edits.
create function public.applications_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();

  if public.is_staff() then
    if new.status in ('approved', 'denied') and old.status not in ('approved', 'denied') then
      new.decided_at := now();
      new.reviewer_id := auth.uid();
    end if;
    return new;
  end if;

  -- Applicant: can't touch review fields or ownership.
  if new.reviewer_id is distinct from old.reviewer_id
     or new.decided_at is distinct from old.decided_at
     or new.decision_reason is distinct from old.decision_reason
     or new.user_id is distinct from old.user_id then
    raise exception 'Not allowed to change review fields';
  end if;

  -- Applicant status moves: draft -> submitted, needs_info -> submitted.
  if new.status is distinct from old.status then
    if not (old.status in ('draft', 'needs_info') and new.status = 'submitted') then
      raise exception 'Not allowed to change status from % to %', old.status, new.status;
    end if;
    if not (new.attested and new.consented and coalesce(new.signature_name, '') <> '') then
      raise exception 'Attestation, consent and signature are required to submit';
    end if;
    new.submitted_at := now();
  end if;

  return new;
end $$;

create trigger applications_guard
  before update on public.applications for each row execute function public.applications_guard();

-- Applicants can only create a draft for themselves.
create function public.applications_insert_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'draft' or new.reviewer_id is not null or new.decided_at is not null then
    raise exception 'New applications must start as drafts';
  end if;
  return new;
end $$;

create trigger applications_insert_guard
  before insert on public.applications for each row execute function public.applications_insert_guard();

-- Can the current user edit this application (owner + draft/needs_info)?
create function public.can_edit_application(app_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications
    where id = app_id and user_id = auth.uid() and status in ('draft', 'needs_info')
  );
$$;

create function public.owns_application(app_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.applications where id = app_id and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Address history
-- ---------------------------------------------------------------------------
create table public.address_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  address text not null,
  in_neighborhood boolean not null default true,
  moved_in date not null,
  moved_out date,             -- null = still lives here
  created_at timestamptz not null default now(),
  check (moved_out is null or moved_out >= moved_in)
);
create index on public.address_history (application_id);

-- ---------------------------------------------------------------------------
-- Documents (files live in the private "documents" bucket)
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind public.document_kind not null,
  doc_type text,
  document_date date,         -- month the document is dated (residency docs)
  address_id uuid references public.address_history (id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index on public.documents (application_id);

-- ---------------------------------------------------------------------------
-- Staff tables
-- ---------------------------------------------------------------------------
create table public.info_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  message text not null,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.info_requests (application_id);

create table public.review_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id),
  author_email text,
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.review_notes (application_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null default auth.uid() references auth.users (id),
  actor_email text,
  action text not null,       -- e.g. 'view_document', 'status_change', 'request_info'
  application_id uuid references public.applications (id) on delete set null,
  document_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_log (application_id, created_at desc);

-- When an applicant resubmits, mark open info requests resolved.
create function public.resolve_info_requests()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'needs_info' and new.status = 'submitted' then
    update public.info_requests set resolved_at = now()
    where application_id = new.id and resolved_at is null;
  end if;
  return new;
end $$;

create trigger resolve_info_requests
  after update on public.applications for each row execute function public.resolve_info_requests();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.address_history enable row level security;
alter table public.documents enable row level security;
alter table public.info_requests enable row level security;
alter table public.review_notes enable row level security;
alter table public.audit_log enable row level security;

-- profiles: read your own; staff read all. Roles are changed in the SQL editor only.
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

-- applications
create policy "applications: read own or staff" on public.applications
  for select using (user_id = auth.uid() or public.is_staff());
create policy "applications: create own draft" on public.applications
  for insert with check (user_id = auth.uid());
create policy "applications: applicant edits while open" on public.applications
  for update using (user_id = auth.uid() and status in ('draft', 'needs_info'))
  with check (user_id = auth.uid());
create policy "applications: staff update" on public.applications
  for update using (public.is_staff()) with check (public.is_staff());

-- address_history
create policy "addresses: read own or staff" on public.address_history
  for select using (public.owns_application(application_id) or public.is_staff());
create policy "addresses: add while open" on public.address_history
  for insert with check (public.can_edit_application(application_id));
create policy "addresses: edit while open" on public.address_history
  for update using (public.can_edit_application(application_id))
  with check (public.can_edit_application(application_id));
create policy "addresses: delete while open" on public.address_history
  for delete using (public.can_edit_application(application_id));

-- documents
create policy "documents: read own or staff" on public.documents
  for select using (public.owns_application(application_id) or public.is_staff());
create policy "documents: add while open" on public.documents
  for insert with check (
    public.can_edit_application(application_id)
    and split_part(storage_path, '/', 1) = auth.uid()::text
  );
create policy "documents: delete while open" on public.documents
  for delete using (public.can_edit_application(application_id));

-- info_requests: applicant reads own; staff read/write
create policy "info requests: read own or staff" on public.info_requests
  for select using (public.owns_application(application_id) or public.is_staff());
create policy "info requests: staff create" on public.info_requests
  for insert with check (public.is_staff() and created_by = auth.uid());

-- review_notes: staff only, never visible to applicants
create policy "notes: staff read" on public.review_notes
  for select using (public.is_staff());
create policy "notes: staff create" on public.review_notes
  for insert with check (public.is_staff() and author_id = auth.uid());

-- audit_log: staff can append; only admins can read; nobody can edit or delete
create policy "audit: staff append" on public.audit_log
  for insert with check (public.is_staff() and actor_id = auth.uid());
create policy "audit: admin read" on public.audit_log
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private storage bucket for uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 10485760,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf']
)
on conflict (id) do update set public = false;

-- Files are stored as <user id>/<application id>/<random>-<name>
create policy "storage: applicant uploads to own folder while open" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_edit_application(((storage.foldername(name))[2])::uuid)
  );

create policy "storage: applicant reads own, staff reads all" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

create policy "storage: applicant deletes own while open" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_edit_application(((storage.foldername(name))[2])::uuid)
  );
