/**
 * The language section's Server Action. Nothing in the interface is translated
 * yet, so this stores the choice and changes nothing else.
 */

"use server";

import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { getPreferences, savePreferences } from "@/lib/preferences/preferences";
import { parseLanguage } from "@/lib/validation/forms/language.schema";

export type LanguageActionState = {
  error: string | null;
  // The visible success state, since the page it returns to looks unchanged.
  done?: boolean;
};

/** Saves the chosen language. */
export async function saveLanguageAction(
  _previous: LanguageActionState,
  formData: FormData,
): Promise<LanguageActionState> {
  const parsed = parseLanguage(Object.fromEntries(formData));
  if (!parsed.ok) return { error: parsed.errors.locale ?? GENERIC_FAILURE };

  try {
    // The endpoint replaces both preferences, so the saved theme has to go back
    // with the language or saving one would reset the other.
    const current = await getPreferences();
    await savePreferences({ ...current, locale: parsed.values.locale });
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  return { error: null, done: true };
}
