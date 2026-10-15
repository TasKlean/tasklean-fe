/**
 * Ends the session. A client component only for the pending label: the form
 * posts to the action with or without JavaScript.
 */

"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

type LogoutButtonProps = {
  className: string;
};

/** Renders the sign-out control, disabled while the action is in flight. */
export function LogoutButton({ className }: LogoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      <LogOut className="size-4" aria-hidden />
      <span>{pending ? "Signing you out…" : "Log out"}</span>
    </button>
  );
}
