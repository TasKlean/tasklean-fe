/**
 * The language field: a button and a listbox of our own, so the control wears
 * the app's surfaces instead of the OS menu. Focus stays on the button and
 * `aria-activedescendant` names the active row, the ARIA select-only pattern.
 */

"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { type AppLocale, LOCALES } from "@/lib/preferences/preferences.types";

type LocaleSelectProps = {
  label: string;
  // The field name the form posts, carried by a hidden input.
  name: string;
  value: AppLocale;
  onChange: (value: AppLocale) => void;
};

// Endonyms: a language picker reads in the language it offers.
const LABELS: Record<AppLocale, string> = {
  EN: "English",
  DE: "Deutsch",
  SL: "Slovenščina",
};

const TRIGGER =
  "bg-card border-input text-body-md text-foreground focus-visible:ring-ring px-space-sm gap-space-sm flex min-h-11 w-full items-center justify-between rounded-md border text-left focus-visible:ring-2 focus-visible:outline-none";

const OPTION =
  "px-space-sm gap-space-sm text-body-md text-foreground flex min-h-11 items-center justify-between rounded-sm text-left";

/** Renders the language field and its own dropdown. */
export function LocaleSelect({ label, name, value, onChange }: Readonly<LocaleSelectProps>) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(LOCALES.indexOf(value));

  const buttonId = `${baseId}-button`;
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;

  /** Opens the list with the saved language active, wherever the last move left it. */
  function openList() {
    setActiveIndex(LOCALES.indexOf(value));
    setOpen(true);
  }

  /** Takes an option and closes. */
  function commit(option: AppLocale) {
    onChange(option);
    setActiveIndex(LOCALES.indexOf(option));
    setOpen(false);
  }

  /** Moves the active row, or opens the list if it is closed. */
  function move(delta: number) {
    if (!open) {
      openList();
      return;
    }

    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), LOCALES.length - 1));
  }

  /** Runs the listbox keyboard contract. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      // Without this the browser also fires a click, which would toggle twice.
      event.preventDefault();
      if (open) commit(LOCALES[activeIndex]);
      else openList();
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="gap-space-xs flex flex-col">
      <label id={labelId} htmlFor={buttonId} className="text-label-lg text-foreground">
        {label}
      </label>

      <div className="relative">
        <input type="hidden" name={name} value={value} />

        <button
          type="button"
          id={buttonId}
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-activedescendant={open ? `${baseId}-${LOCALES[activeIndex]}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={TRIGGER}
        >
          {LABELS[value]}

          <ChevronDown
            className={`text-muted-foreground size-4 shrink-0 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {open ? (
          <div
            role="listbox"
            id={listId}
            aria-labelledby={labelId}
            // Keeps focus on the button, so a press on a row is not preceded by
            // a blur that closes the list before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            className="bg-card border-input shadow-level-2 p-space-xs gap-space-xs mt-space-xs absolute z-10 flex w-full flex-col rounded-md border"
          >
            {LOCALES.map((option, index) => (
              <button
                key={option}
                type="button"
                id={`${baseId}-${option}`}
                role="option"
                aria-selected={option === value}
                // Out of the tab order: focus belongs to the combobox button,
                // which is what `aria-activedescendant` reads these rows to.
                tabIndex={-1}
                onClick={() => commit(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`${OPTION} ${index === activeIndex ? "bg-accent/40" : ""}`}
              >
                {LABELS[option]}

                {option === value ? (
                  <Check className="text-primary size-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
