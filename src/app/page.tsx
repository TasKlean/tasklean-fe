// Placeholder. The real root route ("today": tasks due now) arrives with the task
// feature; this exists only so the scaffold has something to render and so the
// design tokens, font and dark mode can be eyeballed.
// No `metadata` export on purpose: the root layout's title `default` already
// renders this page as "TasKlean", and setting a title here would run through
// the template and give "Home - TasKlean". This route is protected and becomes
// the task feed, so a tab title is all it ever needs — no SEO is coming.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">TasKlean</h1>
        <p className="text-muted-foreground mt-1">Clean tasks, clear minds.</p>
      </div>

      <div className="border-border bg-surface rounded-card border p-4">
        <p className="text-sm">
          Scaffold is running. Tokens, font and dark mode are wired; nothing else is built yet.
        </p>
      </div>
    </main>
  );
}
