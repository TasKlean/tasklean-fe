/**
 * How the board is laid out, kept in a cookie rather than the URL: it is the
 * reader's own preference and should follow them to the next group, where a
 * filter belongs to the board being looked at and should not.
 *
 * Written only from the Server Action behind the pills, like every cookie: a
 * Server Component render cannot set one.
 */

import "server-only";

import { cookies } from "next/headers";
import { BOARD_VIEWS, type BoardView, DEFAULT_VIEW } from "@/lib/tasks/view/view.types";

export const VIEW_COOKIE_NAME = "tasklean_view";

// 400 days, the ceiling Chrome enforces. Rewritten whenever the pills are used.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export const VIEW_COOKIE_OPTIONS = {
  // Nothing in the browser reads it: the layout it picks is server-rendered.
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/**
 * Narrows a stored value to a layout we draw.
 *
 * @returns The view, or the default for anything else: the cookie is the
 * reader's browser and may hold whatever was put there.
 */
export function asBoardView(value: string | undefined): BoardView {
  return BOARD_VIEWS.find((known) => known === value) ?? DEFAULT_VIEW;
}

/** Reads the chosen layout. */
export async function readBoardView(): Promise<BoardView> {
  return asBoardView((await cookies()).get(VIEW_COOKIE_NAME)?.value);
}

/**
 * Remembers the chosen layout for the next render.
 *
 * Only callable from a Route Handler or Server Action.
 */
export async function writeBoardView(view: BoardView): Promise<void> {
  (await cookies()).set(VIEW_COOKIE_NAME, view, VIEW_COOKIE_OPTIONS);
}
