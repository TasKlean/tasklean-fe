/**
 * A password field with a show/hide toggle. Split from TextField so plain fields
 * stay out of a client boundary.
 */

"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { TextField } from "@/components/common/text-field";

type PasswordFieldProps = {
  label: string;
  name: string;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  labelAction?: ReactNode;
};

/** Renders a password input whose value can be revealed. */
export function PasswordField({
  label,
  name,
  error,
  autoComplete = "current-password",
  placeholder,
  labelAction,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      name={name}
      type={visible ? "text" : "password"}
      error={error}
      required
      autoComplete={autoComplete}
      placeholder={placeholder}
      labelAction={labelAction}
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
