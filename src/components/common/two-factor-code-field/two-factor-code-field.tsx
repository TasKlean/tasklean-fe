/**
 * One field for either kind of second-factor code, posted under one name: six
 * boxes for an authenticator code, a plain field for a recovery code. Switching
 * clears the value, because a code of one kind is never a code of the other.
 */

"use client";

import { KeyRound } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useState } from "react";
import { CodeInput } from "@/components/common/code-input/code-input";
import { TextField } from "@/components/common/text-field/text-field";

type TwoFactorCodeFieldProps = {
  name: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  error?: string;
  onBlur?: () => void;
  // Called after the kind changed and the value was dropped, so the form can
  // forget what it knew about the code it was holding.
  onSwitch?: () => void;
  // What to call the six boxes. The recovery field is always "Recovery code".
  digitsLabel?: string;
  autoFocus?: boolean;
  // What acts on the code. It sits between the field and the switch, so the
  // switch stays the last thing offered rather than a step on the way.
  children?: ReactNode;
};

const RECOVERY_HINT = "One of the codes you saved. The hyphen and the case do not matter.";

const TOGGLE =
  "text-link hover:text-primary-strong text-body-md focus-visible:ring-ring min-h-11 self-center rounded-full px-4 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none";

/** Renders the code entry and the switch between the two kinds of code. */
export function TwoFactorCodeField({
  name,
  value,
  onChange,
  error,
  onBlur,
  onSwitch,
  digitsLabel = "6-digit code",
  autoFocus = false,
  children,
}: Readonly<TwoFactorCodeFieldProps>) {
  const [recovery, setRecovery] = useState(false);

  /** Swaps the field, dropping a code that belongs to the other kind. */
  function switchTo(useRecovery: boolean) {
    setRecovery(useRecovery);
    onChange("");
    onSwitch?.();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {recovery ? (
        <TextField
          label="Recovery code"
          name={name}
          required
          autoComplete="one-time-code"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="abcd-efgh"
          icon={<KeyRound className="size-5" />}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          error={error}
          hint={RECOVERY_HINT}
        />
      ) : (
        <CodeInput
          name={name}
          label={digitsLabel}
          value={value}
          onChange={onChange}
          error={error}
          autoFocus={autoFocus}
        />
      )}

      {children}

      <button type="button" onClick={() => switchTo(!recovery)} className={TOGGLE}>
        {recovery ? "Use your authenticator app instead" : "Use a recovery code instead"}
      </button>
    </div>
  );
}
