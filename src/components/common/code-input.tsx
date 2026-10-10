/**
 * Six boxes behaving as one field. The value is a dense string of 0–6 digits, so
 * it can never go sparse. `onChange` takes a state updater, not a string: a
 * burst of keystrokes would otherwise all compute from the same stale value.
 */

"use client";

import type { ClipboardEvent, Dispatch, KeyboardEvent, SetStateAction } from "react";
import { useRef } from "react";
import { CODE_LENGTH } from "@/lib/validation/code-length";

type CodeInputProps = {
  name: string;
  label: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  error?: string;
};

const BOXES = Array.from({ length: CODE_LENGTH }, (_, index) => index);

/** Renders the six-box verification code field. */
export function CodeInput({ name, label, value, onChange, error }: CodeInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = `${name}-error`;

  function focusBox(index: number) {
    boxes.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      onChange((current) => {
        const target = current[index] ? index : index - 1;
        if (target < 0) return current;
        return current.slice(0, target) + current.slice(target + 1);
      });
      focusBox(value[index] ? index : index - 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
      return;
    }
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      const digit = event.key;
      onChange((current) => {
        // Overflow focus sits on the last box, so a full code must ignore typing.
        if (current.length >= CODE_LENGTH) return current;
        const at = Math.min(index, current.length);
        const next =
          at < current.length
            ? current.slice(0, at) + digit + current.slice(at + 1)
            : current + digit;
        return next.slice(0, CODE_LENGTH);
      });
      focusBox(index + 1);
    }
  }

  /** Spreads a pasted code across the boxes, whatever it was pasted into. */
  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusBox(pasted.length);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${name}-label`} className="text-label-md text-foreground font-semibold">
        {label}
      </span>

      <div
        role="group"
        aria-labelledby={`${name}-label`}
        aria-describedby={error ? errorId : undefined}
        className="gap-space-xs flex justify-between sm:gap-3"
      >
        {BOXES.map((index) => (
          <input
            key={index}
            ref={(element) => {
              boxes.current[index] = element;
            }}
            // On the first box only, or the hint is offered six times over.
            autoComplete={index === 0 ? "one-time-code" : "off"}
            inputMode="numeric"
            // Not `number`: it renders spinners and accepts `e` and `-`.
            type="text"
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={error ? true : undefined}
            value={value[index] ?? ""}
            onChange={() => {}}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            // Pulls focus back to the first empty box. On click, not focus:
            // focus also fires for the programmatic move after a keystroke.
            onClick={() => {
              if (index > value.length) focusBox(value.length);
            }}
            className={[
              "bg-muted text-foreground text-headline-md sm:text-headline-lg",
              "size-12 rounded-md text-center transition-all duration-200 outline-none sm:size-14",
              "focus:bg-card focus:shadow-level-1 focus-visible:ring-ring/40 focus-visible:ring-2",
              error ? "ring-destructive/60 ring-2" : "",
            ].join(" ")}
          />
        ))}
      </div>

      <input type="hidden" name={name} value={value} />

      {error ? (
        <p id={errorId} className="text-label-md text-destructive text-center">
          {error}
        </p>
      ) : null}
    </div>
  );
}
