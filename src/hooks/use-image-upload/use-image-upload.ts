/**
 * One picked image on its way to the bucket: resized the moment it is picked,
 * sent when the form asks. The two halves are split because the bytes have to
 * be final before a signature can be asked for, and because a file we cannot
 * use is worth saying at the press that picked it rather than at Save.
 *
 * Pointing something at the uid afterwards is not here: that is the form's own
 * action, since only the form knows what else it is saving.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { requestUploadAction } from "@/app/(app)/uploads/actions/actions";
import { resizeImage } from "@/lib/images/resize/resize";
import { putObject, UPLOAD_FAILED } from "@/lib/uploads/put-object/put-object";
import type {
  ImageUpload,
  ImageUploadOptions,
  ImageUploadState,
} from "@/hooks/use-image-upload/use-image-upload.types";

const IDLE: ImageUploadState = { staged: null, busy: false, failure: null };

/** Lets go of an object URL, which nothing else ever reclaims. */
function revoke(held: RefObject<string | null>): void {
  if (held.current) URL.revokeObjectURL(held.current);
  held.current = null;
}

/**
 * Runs a picked image through resizing, signing and sending.
 *
 * @returns The picture to show, what state it is in, and the three things a
 * form does with it. `upload` answers with the uid to attach, or null with the
 * reason left in `failure`.
 */
export function useImageUpload({ purpose, targetUid }: Readonly<ImageUploadOptions>): ImageUpload {
  const [state, setState] = useState<ImageUploadState>(IDLE);
  const held = useRef<string | null>(null);
  const picks = useRef(0);

  // Unmount is the last chance to reclaim the URL: every other release happens
  // where the picture it stands for is replaced.
  useEffect(() => () => revoke(held), []);

  const clear = useCallback(() => {
    // Counted, so a resize still running lands nowhere instead of appearing
    // after the picture it would replace was already taken away.
    picks.current += 1;
    revoke(held);
    setState(IDLE);
  }, []);

  const stage = useCallback(async (file: Blob) => {
    const pick = (picks.current += 1);
    setState((current) => ({ ...current, busy: true, failure: null }));

    const resized = await resizeImage(file);
    if (pick !== picks.current) return;

    // The picture already picked survives a file we cannot read, since the
    // reader has lost nothing but the attempt.
    if (!resized.ok) {
      setState((current) => ({ ...current, busy: false, failure: resized.message }));
      return;
    }

    revoke(held);
    held.current = URL.createObjectURL(resized.blob);
    setState({
      staged: { blob: resized.blob, type: resized.type, preview: held.current },
      busy: false,
      failure: null,
    });
  }, []);

  const staged = state.staged;

  const upload = useCallback(async (): Promise<string | null> => {
    if (!staged) return null;

    setState((current) => ({ ...current, busy: true, failure: null }));

    const ticket = await requestUploadAction({
      purpose,
      targetUid,
      contentType: staged.type,
      sizeBytes: staged.blob.size,
    });

    if (!ticket.ok) {
      setState((current) => ({ ...current, busy: false, failure: ticket.message }));
      return null;
    }

    const sent = await putObject(ticket.uploadUrl, staged.blob, staged.type);
    setState((current) => ({ ...current, busy: false, failure: sent ? null : UPLOAD_FAILED }));

    // The bytes are kept either way, so a second press is the whole retry.
    return sent ? ticket.uid : null;
  }, [purpose, staged, targetUid]);

  return {
    preview: staged?.preview ?? null,
    staged: staged !== null,
    busy: state.busy,
    failure: state.failure,
    stage,
    clear,
    upload,
  };
}
