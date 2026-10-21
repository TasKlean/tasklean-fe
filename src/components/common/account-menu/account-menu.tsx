/**
 * The avatar in the chrome and the menu behind it. A disclosure rather than an
 * ARIA menu: the items are links and a submit, so Tab already moves through
 * them correctly and a roving tabindex would only take that away.
 */

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Settings, UserRound } from "lucide-react";
import { logoutAction } from "@/app/(app)/actions/actions";
import { Avatar } from "@/components/common/avatar/avatar";
import { LogoutButton } from "@/components/common/logout-button";

type AccountMenuProps = {
  name: string | null;
  photoUrl: string | null;
};

const ITEM =
  "text-label-lg text-foreground hover:bg-muted gap-space-sm px-space-md flex min-h-11 w-full items-center text-left transition-colors";

/** Renders the account avatar with its menu of account, settings and logout. */
export function AccountMenu({ name, photoUrl }: Readonly<AccountMenuProps>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Sending focus back is what makes Escape usable without a mouse.
      trigger.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Your account"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="hover:bg-muted flex size-11 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <Avatar photoUrl={photoUrl} name={name} />
      </button>

      {open ? (
        <div
          id={panelId}
          className="bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border"
        >
          {name ? (
            <p className="text-label-sm text-muted-foreground px-space-md py-space-xs truncate">
              Signed in as <span className="text-foreground font-semibold">{name}</span>
            </p>
          ) : null}

          <Link href="/app/account" className={ITEM} onClick={() => setOpen(false)}>
            <UserRound className="size-4" aria-hidden />
            Account
          </Link>

          <Link href="/app/settings" className={ITEM} onClick={() => setOpen(false)}>
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>

          <form action={logoutAction} className="border-border/60 mt-1 border-t pt-1">
            <LogoutButton className={ITEM} />
          </form>
        </div>
      ) : null}
    </div>
  );
}
