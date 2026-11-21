/**
 * The board's own presses. Only one so far, and it changes nothing on the
 * backend: the layout is a cookie, and a cookie can only be written from an
 * action or a Route Handler.
 */

"use server";

import { revalidatePath } from "next/cache";
import { asBoardView, writeBoardView } from "@/lib/tasks/view/view";

/**
 * Remembers how the reader wants a board laid out.
 *
 * @param formData The pressed pill, whose submit button carries the view.
 * @returns Nothing: the pills render from the cookie, which the revalidation
 * below makes the next render read.
 */
export async function setBoardViewAction(formData: FormData): Promise<void> {
  const asked = formData.get("view");
  await writeBoardView(asBoardView(typeof asked === "string" ? asked : undefined));

  // Every board, not just this group's: the preference follows the reader, so
  // a cached render of another group would otherwise keep the old layout.
  revalidatePath("/app/groups", "layout");
}
