import { statusLabel } from "@/lib/tasks/status/status";

type StatusPillProps = {
  status: string | undefined;
};

const PILL =
  "text-label-sm bg-muted text-muted-foreground gap-1.5 flex shrink-0 items-center rounded-full px-2.5 py-0.5 whitespace-nowrap";

const DOT = "bg-muted-foreground size-1.5 shrink-0 rounded-full";

/** Renders where a chore has got to. */
export function StatusPill({ status }: Readonly<StatusPillProps>) {
  return (
    <span className={PILL}>
      <span className={DOT} aria-hidden />
      {statusLabel(status)}
    </span>
  );
}
