/**
 * The appearance section's Server Action. It also rewrites the theme cookie,
 * which is what the next server render paints from.
 */

"use server";

import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { getPreferences, savePreferences } from "@/lib/preferences/preferences";
import { writeTheme } from "@/lib/preferences/theme-cookie/theme-cookie";
import { parseAppearance } from "@/lib/validation/forms/appearance.schema/appearance.schema";

export type AppearanceActionState = {
  error: string | null;
  // The visible success state, since the page it returns to looks unchanged.
  done?: boolean;
};

/** Saves the chosen colour scheme and caches it for the next render. */
export async function saveAppearanceAction(
  _previous: AppearanceActionState,
  formData: FormData,
): Promise<AppearanceActionState> {
  const parsed = parseAppearance(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.errors.theme ?? GENERIC_FAILURE };

  try {
    // The endpoint replaces both preferences, so the saved language has to go
    // back with the theme or saving one would reset the other.
    const current = await getPreferences();
    const saved = await savePreferences({ ...current, theme: parsed.values.theme });
    await writeTheme(saved.theme);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  return { error: null, done: true };
}
