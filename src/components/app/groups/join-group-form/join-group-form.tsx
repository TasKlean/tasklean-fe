/**
 * The join-group form. The code is checked for shape before it is sent, because
 * the join bucket is tighter than the general ones and a typo must not spend an
 * attempt from it.
 */

"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { joinGroupAction, type JoinGroupState } from "@/app/(app)/app/groups/join/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field/text-field";
import { validateJoinGroup } from "@/lib/validation/forms/join-group.schema/join-group.schema";

const INITIAL: JoinGroupState = { error: null };

/** Renders the form that redeems an invite code. */
export function JoinGroupForm() {
  const [state, formAction] = useActionState(joinGroupAction, INITIAL);
  const [inviteCode, setInviteCode] = useState(state.inviteCode ?? "");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [handled, setHandled] = useState<JoinGroupState>(state);

  const codeError = validateJoinGroup({ inviteCode }).inviteCode;

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  // An empty field is not a mistake worth flagging until submit.
  const live = submitted || (touched && inviteCode !== "") ? codeError : undefined;
  // The backend's verdict stands until the code is edited: only it can tell an
  // unknown code from a real one, so a well-formed refusal has to survive.
  const shown = live ?? (edited ? undefined : state.fieldErrors?.inviteCode);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (codeError) event.preventDefault();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.alreadyMember ? (
        <FormNotice tone="info">
          You are already in that group.{" "}
          <Link href="/app" className="text-link underline">
            Open your groups
          </Link>
          .
        </FormNotice>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        <TextField
          label="Invite code"
          name="inviteCode"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="A1B2C3D4"
          maxLength={32}
          hint="Eight letters and numbers, from whoever runs the group."
          icon={<KeyRound className="size-5" />}
          value={inviteCode}
          onChange={(event) => {
            setEdited(true);
            setInviteCode(event.target.value);
          }}
          onBlur={() => setTouched(true)}
          error={shown}
        />

        <SubmitButton pendingLabel="Joining the group…">Join group</SubmitButton>
      </form>
    </div>
  );
}
