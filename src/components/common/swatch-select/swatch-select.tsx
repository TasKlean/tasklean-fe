/**
 * A round button that opens a grid of swatches and, closed again, shows only
 * the one chosen. Used for a label's colour and a category's icon.
 *
 * Built on `LocaleSelect`'s mechanics rather than `useDisclosure`, because this
 * posts a value: focus stays on the button, `aria-activedescendant` names the
 * active cell, the popup cancels `mousedown` so a press is not preceded by the
 * blur that closes it, and Enter and Space cancel the default or the browser
 * fires a second toggle. The hook handles a popup that navigates, not this.
 */

"use client";

import { type KeyboardEvent, useId, useState } from "react";
import type {
  SwatchOption,
  SwatchSelectProps,
} from "@/components/common/swatch-select/swatch-select.types";

// Fixed, so the up and down arrows can move by a row. A wrapping row would put
// the column count at the mercy of the viewport, which the keyboard cannot read.
const COLUMNS = 5;

const TRIGGER =
  "bg-card border-input focus-visible:ring-ring hover:bg-muted grid size-11 shrink-0 place-items-center rounded-full border focus-visible:ring-2 focus-visible:outline-none";

const CELL = "grid size-11 place-items-center rounded-full ring-offset-2 ring-offset-card";

// `w-max` is load-bearing. An absolute panel shrinks to fit the width its
// containing block offers, and that block is the 44px trigger, so without it
// the five columns are squeezed into one cell's width. The padding is what the
// chosen cell's ring and its offset need, or the ring is clipped at the edge.
const PANEL =
  "bg-card border-input shadow-level-2 p-space-sm mt-space-xs absolute left-0 z-10 grid w-max grid-cols-5 gap-0.5 rounded-md border";

/** Renders the chosen swatch, and the grid a press opens. */
export function SwatchSelect({
  name,
  label,
  value,
  options,
  fallback,
  onChange,
}: Readonly<SwatchSelectProps>) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const listId = `${baseId}-list`;
  const chosen = options.find((option) => option.value === value);
  const active = options[activeIndex];

  /** Opens the grid with the stored choice active, wherever the last move left it. */
  function openGrid() {
    setActiveIndex(
      Math.max(
        options.findIndex((option) => option.value === value),
        0,
      ),
    );
    setOpen(true);
  }

  /** Takes a swatch and closes. */
  function commit(option: SwatchOption) {
    onChange(option.value);
    setActiveIndex(options.indexOf(option));
    setOpen(false);
  }

  /** Moves the active cell, or opens the grid if it is closed. */
  function move(delta: number) {
    if (!open) {
      openGrid();
      return;
    }

    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), options.length - 1));
  }

  /** Runs the listbox keyboard contract, a row at a time down and up. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    };
    const delta = steps[event.key];

    if (delta !== undefined) {
      event.preventDefault();
      move(delta);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      // Without this the browser also fires a click, which would toggle twice.
      event.preventDefault();
      if (open && active) commit(active);
      else openGrid();
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-label={`${label}: ${chosen?.label ?? value}`}
        aria-activedescendant={open && active ? `${baseId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openGrid())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={TRIGGER}
      >
        {chosen?.content ?? fallback}
      </button>

      {open ? (
        <div
          role="listbox"
          id={listId}
          aria-label={label}
          // Reachable programmatically but never in the tab order: the role is
          // interactive, while the focus it works with stays on the button.
          tabIndex={-1}
          // Keeps focus on the button, so a press on a cell is not preceded by
          // a blur that closes the grid before the click lands.
          onMouseDown={(event) => event.preventDefault()}
          className={PANEL}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              id={`${baseId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-label={option.label}
              // Out of the tab order: focus belongs to the combobox button,
              // which is what `aria-activedescendant` reads these cells to.
              tabIndex={-1}
              onClick={() => commit(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`${CELL} ${index === activeIndex ? "bg-accent/40" : ""} ${option.value === value ? "ring-foreground ring-2" : ""}`}
            >
              {option.content}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
