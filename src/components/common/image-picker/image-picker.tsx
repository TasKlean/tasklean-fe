/**
 * One picture, picked or dropped, with what is already there shown beside the
 * presses that change it. It knows nothing about what the picture is for: it is
 * handed something to draw and told where to send a file, so resizing, signing
 * and sending all stay in the hook above it.
 *
 * The whole labelled block is the drop target rather than the square alone,
 * which is both the easier thing to hit and the one element a reader's
 * assistive technology already treats as this control.
 */

"use client";

import { ImageUp, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  QUIET_PRESS,
  REMOVE_PRESS,
  SPINNER,
  SQUARE_EMPTY,
  SQUARE_FILLED,
  ZONE_IDLE,
  ZONE_OVER,
} from "@/components/common/image-picker/image-picker.styles";
import { describedById } from "@/components/common/text-field/described-by-id";
import { FieldMessage } from "@/components/common/text-field/field-message";
import { MAX_SOURCE_BYTES } from "@/lib/images/resize/resize";

type ImagePickerProps = {
  // Names the control: the file input behind it is hidden, so it carries no
  // label of its own.
  label: string;
  // What to draw, whether that is the file just picked or what is already saved.
  preview: string | null;
  busy: boolean;
  failure: string | null;
  onPick: (file: Blob) => void;
  onRemove: () => void;
};

// The cap on the file picked, not on what is sent: everything is re-encoded
// first, so the backend's own 5 MB is never what a reader runs into.
const HINT = `Any image up to ${MAX_SOURCE_BYTES / 1024 / 1024} MB. It is resized before it is sent.`;

/** Renders the square, the two presses and the one line under them. */
export function ImagePicker({
  label,
  preview,
  busy,
  failure,
  onPick,
  onRemove,
}: Readonly<ImagePickerProps>) {
  const file = useRef<HTMLInputElement>(null);
  const id = useId();
  const [over, setOver] = useState(false);

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (picked) onPick(picked);
    // Cleared, or picking the same file twice in a row fires no second change.
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) onPick(dropped);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // Without this the browser opens the dropped file instead of offering it.
    event.preventDefault();
    setOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Leaving for a child is not leaving, or the zone flickers at every edge.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setOver(false);
  }

  return (
    <div
      role="group"
      aria-labelledby={id}
      aria-describedby={describedById(errorId, hintId, { error: failure ?? undefined, hint: HINT })}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={over ? ZONE_OVER : ZONE_IDLE}
    >
      <p id={id} className="text-label-md text-foreground font-semibold">
        {label}
      </p>

      <div className="gap-space-md flex flex-wrap items-center">
        <span className={preview ? SQUARE_FILLED : SQUARE_EMPTY}>
          {preview ? (
            // `unoptimized`: an object URL has no host the optimizer could be
            // allowed, and the proxied read behind it is session-guarded, which
            // the optimizer's own fetch is not permitted to carry.
            <Image src={preview} alt="" fill unoptimized className="object-cover" />
          ) : (
            <span className="gap-space-xs px-space-xs flex flex-col items-center">
              <ImageUp className="size-6" aria-hidden />
              {/* A touch screen has no drag, so it is offered the presses alone. */}
              <span className="text-label-md pointer-coarse:hidden">Drop a picture here</span>
            </span>
          )}
        </span>

        <div className="gap-space-sm flex flex-wrap items-center">
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={busy}
            aria-busy={busy}
            className={QUIET_PRESS}
          >
            {busy ? (
              <Loader2 className={SPINNER} aria-hidden />
            ) : (
              <ImageUp className="size-4" aria-hidden />
            )}
            {preview ? "Replace photo" : "Choose photo"}
          </button>

          {preview ? (
            <button type="button" onClick={onRemove} disabled={busy} className={REMOVE_PRESS}>
              <Trash2 className="size-4" aria-hidden />
              Remove photo
            </button>
          ) : null}
        </div>
      </div>

      {/* Hidden rather than painted: a file input cannot be made to match the
          rest of the form, and its own label is the browser's to write. */}
      <input
        ref={file}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
        className="sr-only"
      />

      <FieldMessage errorId={errorId} hintId={hintId} error={failure ?? undefined} hint={HINT} />
    </div>
  );
}
