/**
 * How the board is laid out, as two pills in one border. A form rather than
 * links, because the choice is a cookie and only an action may write one, and
 * the two submit buttons carry the value themselves, so there is nothing to
 * keep in state and it works with no JavaScript.
 */

import { setBoardViewAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { VIEW_LABELS } from "@/components/app/group/board/view-pills/view.labels";
import { BOARD_VIEWS, type BoardView } from "@/lib/tasks/view/view.types";

type ViewPillsProps = {
  view: BoardView;
};

// `w-fit` rather than stretch: the bar is a column below `sm`, where the shell
// would otherwise span the row and leave dead space inside its own border.
const SHELL = "border-border/60 bg-card flex w-fit shrink-0 items-center rounded-full border p-0.5";

const PILL =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full transition-colors";

const ON = "bg-secondary text-secondary-foreground";

const OFF = "text-muted-foreground hover:text-foreground";

/** Renders the two layouts, with the current one marked. */
export function ViewPills({ view }: Readonly<ViewPillsProps>) {
  return (
    <form action={setBoardViewAction} className={SHELL}>
      {BOARD_VIEWS.map((option) => {
        const { text, Icon } = VIEW_LABELS[option];
        const here = option === view;

        return (
          <button
            key={option}
            type="submit"
            name="view"
            value={option}
            aria-pressed={here}
            className={`${PILL} ${here ? ON : OFF}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {text}
          </button>
        );
      })}
    </form>
  );
}
