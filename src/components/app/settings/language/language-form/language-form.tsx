/**
 * The language picker. A dropdown rather than cards, since the list of
 * languages will grow, and ours rather than the OS menu, which cannot be
 * themed. Nothing opens without JavaScript, which `LocaleSelect` records.
 */

"use client";

import { useActionState, useState } from "react";
import {
  type LanguageActionState,
  saveLanguageAction,
} from "@/app/(app)/app/settings/language/actions";
import { LocaleSelect } from "@/components/app/settings/language/language-form/locale-select";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import type { AppLocale } from "@/lib/preferences/preferences.types";

type LanguageFormProps = {
  locale: AppLocale;
};

const INITIAL: LanguageActionState = { error: null };

/** Renders the language field and reports how saving it went. */
export function LanguageForm({ locale }: Readonly<LanguageFormProps>) {
  const [state, formAction] = useActionState(saveLanguageAction, INITIAL);
  const [chosen, setChosen] = useState(locale);
  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.done ? <FormNotice tone="success">Your language is saved.</FormNotice> : null}

      {/* No onReset: the value rides in a hidden input, whose attribute React
          keeps current, so the reset after an action restores the same value. */}
      <form action={formAction} className="gap-space-md flex max-w-sm flex-col">
        <LocaleSelect label="Language" name="locale" value={chosen} onChange={setChosen} />

        <SubmitButton pendingLabel="Saving your language…">Save language</SubmitButton>
      </form>
    </div>
  );
}
