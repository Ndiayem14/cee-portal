/** Shown in place of sign-in features until Supabase keys are added to the environment. */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border-2 border-dashed border-sun bg-sun-wash p-6">
        <h1 className="text-2xl font-bold">Almost ready</h1>
        <p className="mt-2">
          Applications open once the database is connected. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your environment, then restart. See the README.
        </p>
      </div>
    </div>
  );
}
