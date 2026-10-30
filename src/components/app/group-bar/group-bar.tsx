/**
 * A group's bottom bar on a phone: the thing you came to do, the way to get
 * someone else in, and the group's own sections behind a More button. Fixed
 * over the end of the section, so exactly one control carries its label,
 * whichever one is open, and the task pill when none of them is. The two
 * controls share one disclosure rooted at the shelf, so pressing one while the
 * other is open switches panels instead of closing and reopening.
 *
 * `lg:hidden`, because the rail carries all of this where there is room.
 */

"use client";

import { Ellipsis, Plus, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { NavEntry } from "@/components/app/group-nav/nav-entry";
import { navSections } from "@/components/app/group-nav/nav-sections";
import { InviteCodeField } from "@/components/app/invite-code/invite-code-field";
import { ShareInvite } from "@/components/app/invite-code/share-invite";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

type GroupBarProps = {
  uid: string;
  // Passed through to the sections, which an admin has more of.
  admin: boolean;
  // The code an admin hands out. Absent for everyone else, who has nothing to
  // share and so is offered no invite control at all.
  inviteCode: string | null;
};

const BAR = "gap-space-sm bottom-space-md inset-x-margin fixed z-40 flex items-center lg:hidden";

// The one thing a group is for, so it wears the brand colour even while it is
// disabled: what it will do is worth showing before it does it.
const TASK =
  "bg-primary text-primary-foreground shadow-level-3 text-label-lg gap-space-sm flex min-h-13 items-center justify-center rounded-full whitespace-nowrap disabled:cursor-not-allowed";

// The panels hang off this rather than off the control that opened them, which
// is what keeps one as wide as the code it holds without leaving the screen, and
// it is the disclosure's root, so a press on one control never closes the other.
const SHELF =
  "bg-card border-border/60 shadow-level-3 gap-space-xs relative flex min-h-13 flex-1 items-center rounded-full border p-1";

const CONTROL =
  "text-label-lg gap-space-sm px-space-sm flex min-h-11 w-full items-center justify-center rounded-full whitespace-nowrap transition-colors";

const RESTING = "bg-muted text-muted-foreground hover:text-foreground";

const ACTIVE = "bg-secondary text-secondary-foreground";

const PANEL =
  "bg-card border-border/60 shadow-level-3 absolute right-0 bottom-full mb-2 rounded-xl border";

const MENU_ITEM =
  "text-label-lg gap-space-sm px-space-md flex min-h-11 w-full items-center transition-colors";

/** Renders the controls a group offers where there is no room for a rail. */
export function GroupBar({ uid, admin, inviteCode }: Readonly<GroupBarProps>) {
  const pathname = usePathname();
  const { open, toggle, close, root, trigger: triggerRef } = useDisclosure();
  const [panel, setPanel] = useState<"invite" | "menu">("invite");
  const invitePanel = useId();
  const menuPanel = useId();

  const sections =
    navSections(uid, pathname, admin).find((band) => band.phone === "menu")?.items ?? [];
  const shown = open ? panel : null;
  // One name at a time: a phone has room for the open control's label and
  // nothing else, and the task is what matters while nothing is open.
  const named = shown ?? "task";

  /**
   * Shows one control's panel, or closes it when it is the one already open.
   *
   * @param next Which panel the press asked for.
   * @param pressed The control pressed, which Escape hands focus back to.
   */
  function show(next: "invite" | "menu", pressed: HTMLButtonElement) {
    if (shown === next) {
      close();
      return;
    }

    triggerRef.current = pressed;
    setPanel(next);
    if (!open) toggle();
  }

  return (
    <div className={BAR}>
      <button
        type="button"
        disabled
        aria-label="Add task, coming soon"
        className={`${TASK} ${named === "task" ? "px-space-lg flex-2" : "px-space-md shrink-0"}`}
      >
        <Plus className="size-5 shrink-0" aria-hidden />
        <span className={named === "task" ? "" : "hidden"}>Add task</span>
      </button>

      <div ref={root} className={SHELF}>
        {inviteCode ? (
          <div className="flex-1">
            <button
              type="button"
              aria-label="Invite someone"
              aria-haspopup="true"
              aria-expanded={shown === "invite"}
              aria-controls={shown === "invite" ? invitePanel : undefined}
              onClick={(event) => show("invite", event.currentTarget)}
              className={`${CONTROL} ${shown === "invite" ? ACTIVE : RESTING}`}
            >
              <UserPlus className="size-5 shrink-0" aria-hidden />
              <span className={named === "invite" ? "" : "hidden"}>Invite</span>
            </button>

            {shown === "invite" ? (
              <div
                id={invitePanel}
                className={`${PANEL} p-space-md gap-space-sm flex w-72 flex-col`}
              >
                <p className="text-label-md text-muted-foreground">
                  Anyone holding this code can join.
                </p>

                {/* No replacement here: issuing a new code locks out everyone
                    holding the old one, which belongs where its warning fits. */}
                <div className="gap-space-sm flex items-center">
                  <InviteCodeField code={inviteCode} />
                  <ShareInvite />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1">
          <button
            type="button"
            aria-label="Group sections"
            aria-haspopup="true"
            aria-expanded={shown === "menu"}
            aria-controls={shown === "menu" ? menuPanel : undefined}
            onClick={(event) => show("menu", event.currentTarget)}
            className={`${CONTROL} ${shown === "menu" ? ACTIVE : RESTING}`}
          >
            <Ellipsis className="size-5 shrink-0" aria-hidden />
            <span className={named === "menu" ? "" : "hidden"}>Administration</span>
          </button>

          {shown === "menu" ? (
            <ul id={menuPanel} className={`${PANEL} py-space-xs w-56 overflow-hidden`}>
              {sections.map((item) => (
                <li key={item.label}>
                  <NavEntry
                    item={item}
                    open={pathname === item.href}
                    shape={MENU_ITEM}
                    onChoose={close}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
