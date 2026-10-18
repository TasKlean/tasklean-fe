/**
 * The theme picker: one form, three submit buttons, so a single click saves
 * whether or not JavaScript is running. The repaint happens here rather than
 * waiting for the answer, because `data-theme` sits on <html>, above this
 * route, where a Server Action's re-render cannot reach it.
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  type AppearanceActionState,
  saveAppearanceAction,
} from "@/app/(app)/app/settings/appearance/actions";
import { ThemePreview } from "@/components/app/theme-preview";
import { FormNotice } from "@/components/common/form-notice";
import { themeAttribute } from "@/lib/preferences/theme-attribute";
import { THEMES, type Theme } from "@/lib/preferences/preferences.types";

type AppearanceFormProps = {
  // The saved theme, which the server has already painted the page with.
  theme: Theme;
};

const INITIAL: AppearanceActionState = { error: null };

const LABELS: Record<Theme, { name: string; hint: string }> = {
  SYSTEM: { name: "System", hint: "Match your device" },
  DARK: { name: "Dark", hint: "Always dark" },
  LIGHT: { name: "Light", hint: "Always light" },
};

/** Paints a theme at once, the way the next server render would. */
function paint(theme: Theme): void {
  const attribute = themeAttribute(theme);
  if (attribute) {
    document.documentElement.dataset.theme = attribute;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

/** Renders the three schemes and reports how saving one went. */
export function AppearanceForm({ theme }: AppearanceFormProps) {
  const [state, formAction, pending] = useActionState(saveAppearanceAction, INITIAL);
  const [picked, setPicked] = useState<Theme | null>(null);

  // Derived rather than stored: a refused save must not leave the picker
  // claiming a theme the account does not have.
  const chosen = state.error ? theme : (picked ?? theme);

  useEffect(() => {
    if (state.error) paint(theme);
  }, [state.error, theme]);

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.done ? <FormNotice tone="success">Your appearance is saved.</FormNotice> : null}

      <form action={formAction}>
        <fieldset disabled={pending}>
          <legend className="sr-only">Colour scheme</legend>

          <div className="gap-space-sm grid grid-cols-3">
            {THEMES.map((option) => {
              const active = chosen === option;

              return (
                <button
                  key={option}
                  type="submit"
                  name="theme"
                  value={option}
                  aria-pressed={active}
                  onClick={() => {
                    setPicked(option);
                    paint(option);
                  }}
                  className={`p-space-sm gap-space-xs focus-visible:ring-ring flex flex-col rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                    active
                      ? "border-primary bg-accent/40"
                      : "border-border/60 hover:bg-muted bg-card"
                  }`}
                >
                  <ThemePreview theme={option} />

                  <span className="gap-space-xs flex items-center">
                    <span className="text-label-lg text-foreground">{LABELS[option].name}</span>

                    {active && pending ? (
                      <Loader2 className="text-primary size-4 animate-spin" aria-hidden />
                    ) : null}

                    {active && !pending ? (
                      <Check className="text-primary size-4 shrink-0" aria-hidden />
                    ) : null}
                  </span>

                  <span className="text-label-sm text-muted-foreground">{LABELS[option].hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
