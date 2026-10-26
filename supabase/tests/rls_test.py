"""Security tests for the CEE schema against a local Postgres with a Supabase mock."""
import json, uuid, psycopg

import os
conn = psycopg.connect(os.environ.get("TEST_DATABASE_URL", "host=/var/tmp/ceepg port=5499 user=postgres dbname=cee"), autocommit=True)
results = []

def admin(sql, *args):
    with conn.cursor() as c:
        c.execute("reset role")
        c.execute(sql, args)
        return c.fetchall() if c.description else None

def as_user(uid, aal="aal1"):
    def run(sql, *args):
        with conn.cursor() as c:
            c.execute("begin")
            try:
                c.execute("set local role authenticated")
                c.execute("select set_config('request.jwt.claim.sub', %s, true)", (str(uid),))
                c.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": str(uid), "aal": aal}),))
                c.execute(sql, args)
                rows = c.fetchall() if c.description else c.rowcount
                c.execute("commit")
                return rows
            except Exception:
                c.execute("rollback")
                raise
    return run

def as_anon(sql, *args):
    with conn.cursor() as c:
        c.execute("begin")
        try:
            c.execute("set local role anon")
            c.execute(sql, args)
            rows = c.fetchall() if c.description else c.rowcount
            c.execute("commit")
            return rows
        except Exception:
            c.execute("rollback")
            raise

def check(name, fn, expect_error=False):
    try:
        out = fn()
        ok = not expect_error and out is not False
        results.append((ok, name, "" if ok else f"expected error, got {out!r}"))
    except Exception as e:
        msg = str(e).splitlines()[0]
        results.append((expect_error, name, "" if expect_error else msg))

def new_user(email):
    return admin("insert into auth.users (email) values (%s) returning id", email)[0][0]

A, B, R, ADM = new_user("a@x.org"), new_user("b@x.org"), new_user("rev@x.org"), new_user("admin@x.org")
admin("update public.profiles set role='reviewer' where id=%s", R)
admin("update public.profiles set role='admin' where id=%s", ADM)
a, b = as_user(A), as_user(B)
r1, r2, adm = as_user(R, "aal1"), as_user(R, "aal2"), as_user(ADM, "aal2")

check("profile auto-created on sign-up", lambda: len(admin("select 1 from public.profiles where id=%s", A)) == 1)
check("applicant creates own draft", lambda: a("insert into applications (user_id, first_name) values (%s, 'Ann') returning id", A))
APP = admin("select id from applications where user_id=%s", A)[0][0]
check("applicant cannot create an approved application",
      lambda: b("insert into applications (user_id, status) values (%s, 'approved')", B), expect_error=True)
check("applicant cannot create application for someone else",
      lambda: b("insert into applications (user_id) values (%s)", A), expect_error=True)
check("other applicant cannot see A's application", lambda: b("select * from applications") == [])
check("applicant edits own draft", lambda: a("update applications set last_name='Lee' where id=%s", APP) == 1)
check("applicant cannot approve self",
      lambda: a("update applications set status='approved' where id=%s", APP), expect_error=True)
check("applicant cannot write decision reason",
      lambda: a("update applications set decision_reason='ok' where id=%s", APP), expect_error=True)
check("submit blocked without attestation",
      lambda: a("update applications set status='submitted' where id=%s", APP), expect_error=True)

check("applicant adds address", lambda: a(
    "insert into address_history (application_id, address, moved_in) values (%s, '1 Oak Dr SE', '2010-01-01')", APP) == 1)
check("other applicant cannot add address to A's app", lambda: b(
    "insert into address_history (application_id, address, moved_in) values (%s, 'x', '2010-01-01')", APP), expect_error=True)
check("applicant adds doc in own folder", lambda: a(
    "insert into documents (application_id, kind, storage_path, file_name) values (%s, 'residency', %s, 'bill.pdf')",
    APP, f"{A}/{APP}/x-bill.pdf") == 1)
check("doc path in someone else's folder rejected", lambda: a(
    "insert into documents (application_id, kind, storage_path, file_name) values (%s, 'residency', %s, 'b.pdf')",
    APP, f"{B}/{APP}/y.pdf"), expect_error=True)
check("storage: upload to own folder", lambda: a(
    "insert into storage.objects (bucket_id, name) values ('documents', %s)", f"{A}/{APP}/x-bill.pdf") == 1)
check("storage: upload to another user's folder rejected", lambda: b(
    "insert into storage.objects (bucket_id, name) values ('documents', %s)", f"{A}/{APP}/evil.pdf"), expect_error=True)
check("storage: other applicant cannot read A's file", lambda: b("select * from storage.objects") == [])

check("submit with attestation + consent + signature", lambda: a(
    "update applications set attested=true, consented=true, signature_name='Ann Lee', status='submitted' where id=%s", APP) == 1)
check("submitted_at set by trigger", lambda: admin("select submitted_at is not null from applications where id=%s", APP)[0][0])
check("applicant cannot edit after submitting", lambda: a("update applications set first_name='Z' where id=%s", APP) == 0)
check("storage: upload blocked after submitting", lambda: a(
    "insert into storage.objects (bucket_id, name) values ('documents', %s)", f"{A}/{APP}/late.pdf"), expect_error=True)
check("applicant cannot add docs after submitting", lambda: a(
    "insert into documents (application_id, kind, storage_path, file_name) values (%s, 'residency', %s, 'late.pdf')",
    APP, f"{A}/{APP}/late.pdf"), expect_error=True)

check("reviewer WITHOUT 2FA sees nothing", lambda: r1("select * from applications") == [])
check("reviewer WITHOUT 2FA cannot read files", lambda: r1("select * from storage.objects") == [])
check("reviewer with 2FA sees application", lambda: len(r2("select * from applications")) == 1)
check("reviewer with 2FA can read files", lambda: len(r2("select * from storage.objects")) == 1)
check("reviewer requests info", lambda: r2(
    "insert into info_requests (application_id, message, created_by) values (%s, 'Need 2019', %s)", APP, R) == 1)
check("reviewer sets needs_info", lambda: r2("update applications set status='needs_info' where id=%s", APP) == 1)
check("applicant can see the info request", lambda: len(a("select * from info_requests")) == 1)
check("applicant can edit again while needs_info", lambda: a("update applications set household_note='mom' where id=%s", APP) == 1)
check("applicant resubmits", lambda: a("update applications set status='submitted' where id=%s", APP) == 1)
check("info request auto-resolved on resubmit",
      lambda: admin("select resolved_at is not null from info_requests where application_id=%s", APP)[0][0])

check("reviewer adds note", lambda: r2(
    "insert into review_notes (application_id, author_id, body) values (%s, %s, 'looks good')", APP, R) == 1)
check("applicant cannot read team notes", lambda: a("select * from review_notes") == [])
check("reviewer appends audit entry", lambda: r2(
    "insert into audit_log (actor_id, action, application_id) values (%s, 'view_document', %s)", R, APP) == 1)
check("reviewer cannot forge audit entry as someone else", lambda: r2(
    "insert into audit_log (actor_id, action) values (%s, 'x')", ADM), expect_error=True)
check("reviewer cannot read audit log", lambda: r2("select * from audit_log") == [])
check("admin can read audit log", lambda: len(adm("select * from audit_log")) == 1)
check("nobody can delete audit entries", lambda: adm("delete from audit_log") == 0)
check("reviewer approves", lambda: r2("update applications set status='approved' where id=%s", APP) == 1)
check("decided_at and reviewer recorded",
      lambda: admin("select decided_at is not null and reviewer_id = %s from applications where id=%s", R, APP)[0][0])
check("applicant cannot change role to admin", lambda: a("update profiles set role='admin' where id=%s", A) == 0)
check("is_staff() false for applicant", lambda: a("select public.is_staff()")[0][0] is False)

check("signed-out visitor sees no applications", lambda: as_anon("select * from applications") == [])
check("signed-out visitor sees no files", lambda: as_anon("select * from storage.objects") == [])
check("signed-out visitor cannot call is_staff()", lambda: as_anon("select public.is_staff()"), expect_error=True)
check("nobody can call trigger functions directly", lambda: a("select public.handle_new_user()"), expect_error=True)

passed = sum(ok for ok, *_ in results)
for ok, name, why in results:
    print(("PASS " if ok else "FAIL ") + name + (f"  -> {why}" if why else ""))
print(f"\n{passed}/{len(results)} passed")
