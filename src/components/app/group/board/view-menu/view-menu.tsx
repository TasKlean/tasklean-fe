/**
 * How the board is laid out, as a dropdown. The phone's half of the pair
 * `ViewPills` is: two pills plus a search and a filter press do not share a
 * narrow row, so below `sm` the choice collapses into one control.
 *
 * The panel is the form and the rows are its submit buttons, so the press is
 * the choice and the cookie is written by the one action either shape calls.
 * The trigger stays outside it, having nothing to post.
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { setBoardViewAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { VIEW_LABELS } from "@/components/app/group/board/view-pills/view.labels";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { BOARD_VIEWS, type BoardView } from "@/lib/tasks/view/view.types";

type ViewMenuProps = {
  view: BoardView;
};

const TRIGGER =
  "text-label-md gap-space-xs px-space-md border-border/60 bg-card text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors";

const PANEL =
  "bg-card border-border/60 shadow-level-2 p-space-xs gap-space-xs absolute top-full left-0 z-30 mt-2 flex w-max min-w-full flex-col rounded-xl border";

const ROW =
  "text-label-md gap-space-sm px-space-sm text-foreground hover:bg-muted flex min-h-11 w-full items-center rounded-full text-left transition-colors";

/** Renders the current layout and the list of the other one. */
export function ViewMenu({ view }: Readonly<ViewMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const { text, Icon } = VIEW_LABELS[view];

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Layout, showing ${text.toLowerCase()}`}
        onClick={toggle}
        className={TRIGGER}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {text}
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <form action={setBoardViewAction} className={PANEL}>
          {BOARD_VIEWS.map((option) => {
            const row = VIEW_LABELS[option];

            return (
              <button
                key={option}
                type="submit"
                name="view"
                value={option}
                onClick={close}
                className={ROW}
              >
                <row.Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{row.text}</span>
                {option === view ? (
                  <Check className="text-primary size-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </form>
      ) : null}
    </div>
  );
}
