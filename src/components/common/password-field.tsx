/**
 * A password field with a show/hide toggle. Split from TextField so plain fields
 * stay out of a client boundary.
 */

"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { useState } from "react";
import { TextField } from "@/components/common/text-field";

type PasswordFieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  success?: string;
  below?: ReactNode;
  autoComplete?: string;
  placeholder?: string;
  labelAction?: ReactNode;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

/** Renders a password input whose value can be revealed. */
export function PasswordField({
  label,
  name,
  error,
  hint,
  success,
  below,
  autoComplete = "current-password",
  placeholder,
  labelAction,
  value,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      name={name}
      type={visible ? "text" : "password"}
      error={error}
      hint={hint}
      success={success}
      below={below}
      required
      autoComplete={autoComplete}
      placeholder={placeholder}
      labelAction={labelAction}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      icon={<Lock className="size-5" />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
}
