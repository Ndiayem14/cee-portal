-- Lock down internal functions (Supabase security advisor: SECURITY DEFINER functions callable by anon).
--
-- 1. All policies on our tables apply to signed-in users only, so signed-out visitors
--    never touch them (they're denied by default with RLS on).
-- 2. Trigger functions can't be called by anyone through the API.
--    (Triggers still run: Postgres doesn't check the caller's EXECUTE right for trigger functions.)
-- 3. Helper functions used inside policies can only be called by signed-in users.

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'applications', 'address_history', 'documents',
                        'info_requests', 'review_notes', 'audit_log')
  loop
    execute format('alter policy %I on public.%I to authenticated', p.policyname, p.tablename);
  end loop;
end $$;

revoke execute on function
  public.handle_new_user(),
  public.applications_guard(),
  public.applications_insert_guard(),
  public.resolve_info_requests()
from public, anon, authenticated;

revoke execute on function
  public.is_staff(),
  public.is_admin(),
  public.my_role(),
  public.can_edit_application(uuid),
  public.owns_application(uuid)
from public, anon;

grant execute on function
  public.is_staff(),
  public.is_admin(),
  public.my_role(),
  public.can_edit_application(uuid),
  public.owns_application(uuid)
to authenticated;
