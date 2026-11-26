/**
 * A task's own row element, and the menu it opens. A client component for
 * those two things alone: everything inside a row arrives as children and
 * stays server-rendered.
 *
 * The long press is how a phone reaches the menu, there being no width for a
 * control on every row. It is touch only, and it swallows the click it ends
 * in, which would otherwise open the task over the menu just asked for.
 */

"use client";

import type { ReactNode } from "react";
import { ROW, ROW_MENU } from "@/components/app/group/board/board.styles";
import { TaskMenu } from "@/components/app/group/board/task-menu/task-menu";
import type { TaskActions } from "@/components/app/group/board/task-menu/task-menu.types";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { useLongPress } from "@/hooks/use-long-press/use-long-press";

type RowPressProps = {
  actions: TaskActions;
  // The row's cells, in grid order. Nothing in them is a press of its own
  // beyond the link, which is why they can be rendered on the server.
  children: ReactNode;
};

/** Renders one row, with the menu its three dots and a hold both open. */
export function RowPress({ actions, children }: Readonly<RowPressProps>) {
  const menu = useDisclosure();

  // Opens rather than toggles: a hold is not a second press, and closing on
  // one would mean holding a finger down to dismiss what it had just opened.
  const held = useLongPress(() => {
    if (!menu.open) menu.toggle();
  });

  return (
    <li className={ROW} {...held}>
      {children}

      <span className={ROW_MENU}>
        <TaskMenu actions={actions} menu={menu} />
      </span>
    </li>
  );
}
