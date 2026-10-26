export function PageIntro({ title, lead }: { title: string; lead?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 md:pt-16">
        <h1 className="max-w-3xl text-4xl font-extrabold text-oak sm:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg text-muted sm:text-xl">{lead}</p>}
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="prose-cee mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>;
}
