import Link from "next/link";

export function NotStaff() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-8">
      <h1 className="text-2xl font-bold">This area is for the CEE review team</h1>
      <p className="mt-2 text-muted">
        Your account doesn&rsquo;t have staff access. If you&rsquo;re on the team, ask an admin to add you.
      </p>
      <Link href="/my-application" className="btn btn-primary mt-6">
        Go to my application
      </Link>
    </div>
  );
}
