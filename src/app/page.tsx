/**
 * Design preview, not product: the DESIGN.md tokens and components, so the
 * system can be checked in light and dark. Throwaway — the real root route is
 * the task feed, and these blocks become components once signed off.
 */

// No `metadata` export on purpose: the root layout's `default` renders this as
// "TasKlean", where a title here would give "Home - TasKlean".

// Full class strings: Tailwind scans source text, so an interpolated class name
// would never be generated.
const TYPE_SCALE = [
  { cls: "text-display-lg", label: "display-lg", note: "40/48 · 700" },
  { cls: "text-headline-lg", label: "headline-lg", note: "30/38 · 600" },
  { cls: "text-headline-md", label: "headline-md", note: "24/32 · 600" },
  { cls: "text-headline-sm", label: "headline-sm", note: "20/28 · 600" },
  { cls: "text-title-md", label: "title-md", note: "18/26 · 500" },
  { cls: "text-body-lg", label: "body-lg", note: "16/26 · 400" },
  { cls: "text-body-md", label: "body-md", note: "14/22 · 400" },
  { cls: "text-label-lg", label: "label-lg", note: "14/20 · 600" },
  { cls: "text-label-md", label: "label-md", note: "12/16 · 500" },
  { cls: "text-label-sm", label: "label-sm", note: "11/14 · 600" },
];

const SWATCHES = [
  { cls: "bg-background text-foreground border-border border", name: "background" },
  { cls: "bg-card text-card-foreground border-border border", name: "card" },
  { cls: "bg-muted text-muted-foreground", name: "muted" },
  { cls: "bg-primary text-primary-foreground", name: "primary" },
  { cls: "bg-secondary text-secondary-foreground", name: "secondary" },
  { cls: "bg-accent text-accent-foreground", name: "accent" },
  { cls: "bg-success text-success-foreground", name: "success" },
  { cls: "bg-success-subtle text-success-subtle-foreground", name: "success-subtle" },
  { cls: "bg-warning text-warning-foreground", name: "warning" },
  { cls: "bg-warning-subtle text-warning-subtle-foreground", name: "warning-subtle" },
  { cls: "bg-destructive text-destructive-foreground", name: "destructive" },
  { cls: "bg-destructive-subtle text-destructive-subtle-foreground", name: "destructive-subtle" },
];

const ELEVATIONS = [
  { cls: "shadow-level-1", name: "level-1", note: "resting card" },
  { cls: "shadow-level-2", name: "level-2", note: "hover / selected" },
  { cls: "shadow-level-3", name: "level-3", note: "modal / sheet" },
];

/** Renders the design-system preview. */
export default function Home() {
  return (
    <main className="max-w-app px-gutter md:px-gutter-desktop gap-space-xl py-space-xl mx-auto flex flex-col">
      <header>
        <h1 className="text-display-lg-mobile md:text-display-lg">TasKlean</h1>
        <p className="text-body-lg text-muted-foreground mt-space-xs">
          Clean tasks, clear minds. Design preview — switch your OS theme to check dark mode.
        </p>
      </header>

      {/* Typography */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Typography</h2>
        <div className="bg-card shadow-level-1 p-space-lg gap-space-sm flex flex-col rounded-lg">
          {TYPE_SCALE.map((t) => (
            <div key={t.label} className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={t.cls}>Household harmony</span>
              <span className="text-label-sm text-muted-foreground">
                {t.label} · {t.note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Colour */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Colour</h2>
        <div className="gap-space-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className={`${s.cls} p-space-md flex min-h-20 flex-col justify-end rounded-md`}
            >
              <span className="text-label-md">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Buttons</h2>
        <div className="bg-card shadow-level-1 p-space-lg gap-space-md flex flex-wrap items-center rounded-lg">
          <button
            type="button"
            className="bg-primary text-primary-foreground text-label-lg min-h-11 rounded-full px-6 transition-transform active:scale-95"
          >
            Add a chore
          </button>
          <button
            type="button"
            className="bg-card text-primary border-ring text-label-lg min-h-11 rounded-full border-[1.5px] px-6 transition-transform active:scale-95"
          >
            Secondary
          </button>
          <button
            type="button"
            disabled
            className="bg-muted text-muted-foreground text-label-lg min-h-11 rounded-full px-6 opacity-60"
          >
            Disabled
          </button>
          <button
            type="button"
            aria-label="Quick add"
            className="bg-primary text-accent shadow-level-2 flex size-14 items-center justify-center rounded-full text-2xl leading-none transition-transform active:scale-95"
          >
            +
          </button>
        </div>
      </section>

      {/* Input */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Input</h2>
        <div className="bg-card shadow-level-1 p-space-lg gap-space-md flex flex-col rounded-lg">
          <div className="gap-space-xs flex flex-col">
            <label htmlFor="preview-email" className="text-label-lg">
              Email
            </label>
            <input
              id="preview-email"
              type="email"
              placeholder="you@example.com"
              className="bg-card text-foreground border-input placeholder:text-muted-foreground focus:border-ring focus:ring-ring/30 rounded-md border-[1.5px] px-[18px] py-[14px] outline-none focus:ring-4"
            />
          </div>
          <div className="gap-space-xs flex flex-col">
            <label htmlFor="preview-bad" className="text-label-lg text-destructive">
              Email
            </label>
            <input
              id="preview-bad"
              type="email"
              defaultValue="not-an-email"
              aria-invalid="true"
              aria-describedby="preview-bad-error"
              className="bg-card text-foreground border-destructive rounded-md border-[1.5px] px-[18px] py-[14px] outline-none"
            />
            <p id="preview-bad-error" className="text-label-md text-destructive">
              Enter a valid email address.
            </p>
          </div>
        </div>
      </section>

      {/* Task card */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Task card</h2>
        <div className="gap-space-md flex flex-col">
          <article className="bg-card shadow-level-1 p-space-md gap-space-md flex items-center rounded-xl">
            <span aria-hidden className="border-ring size-6 shrink-0 rounded-full border-2" />
            <div className="min-w-0 flex-1">
              <p className="text-title-md truncate">Empty the dishwasher</p>
              <p className="text-body-md text-muted-foreground">Assigned to Maja</p>
            </div>
            <span className="bg-warning-subtle text-warning-subtle-foreground text-label-sm rounded-full px-3 py-1">
              Today
            </span>
          </article>

          <article className="bg-card shadow-level-2 p-space-md gap-space-md flex items-center rounded-xl">
            <span
              aria-hidden
              className="bg-success text-success-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-sm"
            >
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title-md text-ring truncate line-through">Water the plants</p>
              <p className="text-body-md text-muted-foreground">Completed by Luka</p>
            </div>
            <span className="bg-success-subtle text-success-subtle-foreground text-label-sm rounded-full px-3 py-1">
              Done
            </span>
          </article>
        </div>
      </section>

      {/* Priority badges */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Priority</h2>
        <div className="bg-card shadow-level-1 p-space-lg gap-space-sm flex flex-wrap rounded-lg">
          <span className="bg-warning-subtle text-warning-subtle-foreground text-label-md rounded-full px-3 py-1">
            Urgent
          </span>
          <span className="bg-secondary text-secondary-foreground text-label-md rounded-full px-3 py-1">
            Normal
          </span>
          <span className="bg-accent text-accent-foreground text-label-md rounded-full px-3 py-1">
            Low
          </span>
        </div>
      </section>

      {/* Progress */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Household harmony</h2>
        <div className="bg-card shadow-level-1 p-space-lg gap-space-sm flex flex-col rounded-lg">
          <div className="text-label-lg flex justify-between">
            <span>Today</span>
            <span className="text-muted-foreground">7 of 10</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={70}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Chores completed today"
            className="bg-muted h-3 w-full overflow-hidden rounded-full"
          >
            <div className="bg-success h-full rounded-full" style={{ width: "70%" }} />
          </div>
        </div>
      </section>

      {/* Elevation */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Elevation</h2>
        <div className="gap-space-md grid sm:grid-cols-3">
          {ELEVATIONS.map((e) => (
            <div key={e.name} className={`bg-card ${e.cls} p-space-lg rounded-lg`}>
              <p className="text-label-lg">{e.name}</p>
              <p className="text-body-md text-muted-foreground">{e.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section className="gap-space-md flex flex-col">
        <h2 className="text-label-md text-muted-foreground uppercase">Feedback</h2>
        <div className="gap-space-sm flex flex-col">
          <p className="bg-success-subtle text-success-subtle-foreground text-body-md p-space-md rounded-md">
            Chore added. Maja will see it on her list.
          </p>
          <p className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md">
            That invite code has already been used.
          </p>
        </div>
      </section>
    </main>
  );
}
