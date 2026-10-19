/**
 * The language picker. A select rather than cards: three entries that will grow,
 * and a native one is the control a phone already knows how to present.
 */

"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  type LanguageActionState,
  saveLanguageAction,
} from "@/app/(app)/app/settings/language/actions";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import { asLocale, type AppLocale, LOCALES } from "@/lib/preferences/preferences.types";

type LanguageFormProps = {
  locale: AppLocale;
};

const INITIAL: LanguageActionState = { error: null };

// Endonyms: a language picker reads in the language it offers.
const LABELS: Record<AppLocale, string> = {
  EN: "English",
  DE: "Deutsch",
  SL: "Slovenščina",
};

/** Renders the language select and reports how saving it went. */
export function LanguageForm({ locale }: LanguageFormProps) {
  const [state, formAction] = useActionState(saveLanguageAction, INITIAL);
  const [chosen, setChosen] = useState(locale);
  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.done ? <FormNotice tone="success">Your language is saved.</FormNotice> : null}

      {/* React resets the form once the action answers, which would put the
          select back on the option the page loaded with: the value is state. */}
      <form
        action={formAction}
        onReset={(event) => event.preventDefault()}
        className="gap-space-md flex max-w-sm flex-col"
      >
        <div className="gap-space-xs flex flex-col">
          <label htmlFor="locale" className="text-label-lg text-foreground">
            Language
          </label>

          <div className="relative">
            <select
              id="locale"
              name="locale"
              value={chosen}
              onChange={(event) => setChosen(asLocale(event.target.value))}
              className="bg-card border-input text-body-md text-foreground focus-visible:ring-ring px-space-sm min-h-11 w-full appearance-none rounded-md border pr-10 focus-visible:ring-2 focus-visible:outline-none"
            >
              {LOCALES.map((option) => (
                <option key={option} value={option}>
                  {LABELS[option]}
                </option>
              ))}
            </select>

            <ChevronDown
              className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
              aria-hidden
            />
          </div>
        </div>

        <SubmitButton pendingLabel="Saving your language…">Save language</SubmitButton>
      </form>
    </div>
  );
}
