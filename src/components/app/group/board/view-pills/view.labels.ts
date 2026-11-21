/**
 * What each layout is called and drawn with, shared by the two shapes the
 * choice takes: pills with room for both, a dropdown without.
 */

import { LayoutGrid, type LucideIcon, Rows3 } from "lucide-react";
import type { BoardView } from "@/lib/tasks/view/view.types";

export const VIEW_LABELS: Record<BoardView, { text: string; Icon: LucideIcon }> = {
  list: { text: "List", Icon: Rows3 },
  cards: { text: "Cards", Icon: LayoutGrid },
};
