/**
 * A dropdown that posts a value, for a filter with one answer and too many
 * choices to lay out as pills. A button plus a listbox of our own rather than
 * the platform's, so it wears the app's surfaces, and a hidden input carries
 * the value so the form posts it like any other field.
 *
 * The ARIA select-only pattern, the same contract `LocaleSelect` runs: focus
 * stays on the button and `aria-activedescendant` names the active row.
 *
 * **The list is in flow, not an overlay.** It opens inside a panel that scrolls
 * its own fields, and an absolutely positioned list is clipped by that box: it
 * came out under the panel's footer with most of it cut off. Pushing the fields
 * below it down costs nothing here, where every answer is one line.
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { Fragment, type KeyboardEvent, useId, useState } from "react";
import type { FilterSelectProps } from "@/components/common/filter-select/filter-select.types";

const TRIGGER =
  "bg-card border-border/60 text-body-md text-foreground focus-visible:ring-ring px-space-md gap-space-sm flex min-h-10 w-full items-center justify-between rounded-full border text-left focus-visible:ring-2 focus-visible:outline-none";

const LIST =
  "bg-card border-border/60 p-space-xs gap-space-xs mt-space-xs scrollbar-slim flex max-h-60 w-full flex-col overflow-y-auto rounded-xl border";

const OPTION =
  "px-space-md gap-space-sm text-body-md text-foreground flex min-h-10 items-center justify-between rounded-full text-left";

/** Renders the field, its own dropdown and the input that posts it. */
export function FilterSelect({ label, name, options, value }: Readonly<FilterSelectProps>) {
  const baseId = useId();
  const [picked, setPicked] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      options.findIndex((option) => option.value === value),
      0,
    ),
  );

  const listId = `${baseId}-list`;
  const current = options.find((option) => option.value === picked) ?? options[0];

  /** Opens the list with the chosen row active, wherever the last move left it. */
  function openList() {
    setActiveIndex(
      Math.max(
        options.findIndex((option) => option.value === picked),
        0,
      ),
    );
    setOpen(true);
  }

  /** Takes a row and closes. */
  function commit(index: number) {
    setPicked(options[index].value);
    setActiveIndex(index);
    setOpen(false);
  }

  /** Moves the active row, or opens the list if it is closed. */
  function move(delta: number) {
    if (!open) {
      openList();
      return;
    }

    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), options.length - 1));
  }

  /** Runs the listbox keyboard contract. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      // Without this the browser also fires a click, which would toggle twice,
      // and Enter would submit the form the panel is.
      event.preventDefault();
      if (open) commit(activeIndex);
      else openList();
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={picked} />

      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open ? `${baseId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={TRIGGER}
      >
        <span className="truncate">{current?.label}</span>

        <ChevronDown
          className={`text-muted-foreground size-4 shrink-0 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          id={listId}
          aria-label={label}
          // Reachable programmatically but never in the tab order: the role is
          // interactive, while the focus it works with stays on the button.
          tabIndex={-1}
          // Keeps focus on the button, so a press on a row is not preceded by
          // the blur that would close the list before the click lands.
          onMouseDown={(event) => event.preventDefault()}
          className={LIST}
        >
          {options.map((option, index) => (
            <Fragment key={option.value}>
              {option.divider ? (
                <span aria-hidden className="bg-border/60 mx-space-sm my-0.5 h-px" />
              ) : null}

              <button
                type="button"
                id={`${baseId}-${index}`}
                role="option"
                aria-selected={option.value === picked}
                tabIndex={-1}
                onClick={() => commit(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`${OPTION} ${index === activeIndex ? "bg-accent/40" : ""}`}
              >
                <span className="truncate">{option.label}</span>

                {option.value === picked ? (
                  <Check className="text-primary size-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
