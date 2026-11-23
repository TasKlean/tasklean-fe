/**
 * How the board is laid out, as one pill that moves along a track of two. The
 * chosen layout carries its name and the other is its icon alone, so the
 * control says which it is in the width a phone can spare.
 *
 * A form rather than links, because the choice is a cookie and only an action
 * may write one. The two submit buttons carry the value themselves, so there
 * is nothing in state and the press works with no JavaScript.
 */

import { setBoardViewAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { VIEW_LABELS } from "@/components/app/group/board/view-picker/view.labels";
import { BOARD_VIEWS, type BoardView } from "@/lib/tasks/view/view.types";

type ViewPickerProps = {
  view: BoardView;
};

// `w-fit` rather than stretch: the bar is a grid on a phone, where the track
// would otherwise span its column and leave dead space inside its border.
const TRACK =
  "border-border/60 bg-card gap-1 flex w-fit shrink-0 items-center rounded-full border p-0.5";

const OPTION =
  "text-label-md gap-space-xs focus-visible:ring-ring flex min-h-11 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const ON = "bg-secondary text-secondary-foreground px-space-md";

// Square at the app's floor, which is what a 44px press measures with no
// label in it.
const OFF = "text-muted-foreground hover:text-foreground hover:bg-muted size-11";

/** Renders both layouts, the current one named and the other drawn. */
export function ViewPicker({ view }: Readonly<ViewPickerProps>) {
  return (
    <form action={setBoardViewAction} className={TRACK}>
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
            className={`${OPTION} ${here ? ON : OFF}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {/* The name is read either way: an icon on its own leaves the
                press unnamed for anybody not looking at it. */}
            <span className={here ? undefined : "sr-only"}>{text}</span>
          </button>
        );
      })}
    </form>
  );
}
