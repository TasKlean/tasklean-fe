/**
 * Three bars rating a password, filled left to right. Advisory only — the form
 * accepts any password the backend accepts.
 */

import { scorePassword, type PasswordStrength } from "@/lib/validation/password-strength";

type PasswordStrengthMeterProps = {
  password: string;
};

const LEVELS: Record<
  PasswordStrength,
  { filled: number; label: string; bar: string; text: string }
> = {
  weak: { filled: 1, label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  good: { filled: 2, label: "Good", bar: "bg-warning", text: "text-warning-subtle-foreground" },
  strong: { filled: 3, label: "Strong", bar: "bg-success", text: "text-success-subtle-foreground" },
};

/** Renders the strength bars, or nothing while the field is empty. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const level = LEVELS[scorePassword(password)];

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < level.filled ? level.bar : "bg-muted"
            }`}
          />
        ))}
      </div>
      {/* The bars are decorative; this is what a screen reader announces. */}
      <span aria-live="polite" className={`text-label-md w-12 shrink-0 ${level.text}`}>
        {level.label}
      </span>
    </div>
  );
}
