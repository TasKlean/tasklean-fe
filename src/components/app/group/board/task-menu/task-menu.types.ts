/**
 * What a row's menu is told. The actions are one object because the row
 * passes them straight through, and the state is the row's own: a long press
 * anywhere on it opens this menu as surely as the three dots do.
 */

import type { Disclosure } from "@/hooks/use-disclosure/use-disclosure";

export type TaskActions = {
  groupUid: string;
  taskUid: string;
  // The chore's own name, which is what the press is announced as: a board of
  // identical "More" buttons names nothing a reader could choose between.
  name: string;
  // Reading the chore, which is the row's own link and the one thing every
  // member may do with it.
  viewHref: string;
  editHref: string;
  // False where the chore is not the reader's to change, leaving the menu
  // with View alone. UX only: the delete behind it handles its own 403.
  canEdit: boolean;
};

export type TaskMenuProps = {
  actions: TaskActions;
  menu: Disclosure;
};
