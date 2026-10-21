/**
 * The address the code was sent to: a fact when we were given it, a field when
 * we were not. Either way it posts under the same name.
 */

import { Mail } from "lucide-react";
import { TextField } from "@/components/common/text-field/text-field";

type EmailFieldProps = {
  email: string;
  onEmail: (value: string) => void;
  onBlur: () => void;
  error?: string;
  // Whether the address came with the visit, which makes it a fact to show.
  known: boolean;
  next?: string;
};

/** Renders the address: shown as a fact when we were given it, asked for when not. */
export function EmailField({
  email,
  onEmail,
  onBlur,
  error,
  known,
  next,
}: Readonly<EmailFieldProps>) {
  if (known) {
    return (
      <div className="bg-muted p-space-md flex items-center gap-3 rounded-md">
        <Mail className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-label-md text-muted-foreground">Sent to</p>
          <p className="text-body-md text-foreground truncate font-semibold">{email}</p>
        </div>
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
      </div>
    );
  }

  return (
    <TextField
      label="Email address"
      name="email"
      type="email"
      required
      autoComplete="email"
      placeholder="you@example.com"
      icon={<Mail className="size-5" />}
      value={email}
      onChange={(event) => onEmail(event.target.value)}
      onBlur={onBlur}
      error={error}
    />
  );
}
