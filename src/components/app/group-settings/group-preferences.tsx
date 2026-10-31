/**
 * How this group's tasks will be laid out. Every choice is disabled: there are
 * no tasks to lay out yet and nowhere to store the answer, so the control shows
 * what is coming rather than pretending to save it.
 */

import { CalendarDays, LayoutGrid, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BUTTON } from "@/components/app/group-settings/group-settings.styles";

type TaskView = {
  label: string;
  icon: LucideIcon;
};

const VIEWS: readonly TaskView[] = [
  { label: "List", icon: List },
  { label: "Cards", icon: LayoutGrid },
  { label: "Calendar", icon: CalendarDays },
];

// The one a group gets until the choice is yours to make.
const DEFAULT_VIEW = "List";

/** Renders the task layouts a member will be able to pick between. */
export function GroupPreferences() {
  return (
    <div className="gap-space-sm flex flex-col">
      <div className="gap-space-xs flex flex-wrap">
        {VIEWS.map((view) => {
          const current = view.label === DEFAULT_VIEW;

          return (
            <button
              key={view.label}
              type="button"
              disabled
              aria-pressed={current}
              aria-label={`${view.label}, coming soon`}
              className={`${BUTTON} ${
                current
                  ? "bg-secondary text-secondary-foreground border-transparent"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              <view.icon className="size-4" aria-hidden />
              {view.label}
            </button>
          );
        })}
      </div>

      <p className="text-label-sm text-muted-foreground">
        Coming soon, once there are tasks to show. Until then every group reads as a list.
      </p>
    </div>
  );
}
