/**
 * One crumb of the header's trail, built the way the group pill is: the label
 * half navigates and the arrow half opens the list, so the common move costs no
 * popup and each half is a real control with a name of its own.
 *
 * Shorter than that pill at 36px, because four of these sit in one row and the
 * trail is drawn at `lg` and up only, where every press is a mouse. The rows it
 * drops keep their 44, since those are a list rather than a line of chrome.
 *
 * It wears no border until it is hovered, so a row of four reads as a trail
 * rather than as four buttons.
 */

"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import type { Crumb } from "@/components/app/chrome/group-breadcrumb/group-breadcrumb.types";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

type CrumbPillProps = {
  crumb: Crumb;
  // The end of the trail, which is the screen being read.
  here: boolean;
};

const ITEM =
  "text-label-lg gap-space-sm px-space-md flex min-h-11 w-full items-center transition-colors";

const ON = "bg-muted text-foreground";
const OFF = "text-muted-foreground hover:bg-muted hover:text-foreground";

// A section with no screen behind it yet. Not a link, so it takes the row's
// shape without any of its presses.
const DEAD = "text-muted-foreground/60 cursor-not-allowed";

/** Renders one crumb and the list its arrow drops. */
export function CrumbPill({ crumb, here }: Readonly<CrumbPillProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();

  return (
    <div ref={root} className="relative min-w-0">
      {/* The border is transparent rather than absent, so showing it on hover
          costs no layout: dropping it outright moved every crumb by 2px. */}
      <div className="hover:border-border/60 group flex min-w-0 items-center rounded-full border border-transparent transition-colors">
        <Link
          href={crumb.href}
          aria-current={here ? "page" : undefined}
          className="text-label-lg text-foreground hover:bg-muted px-space-md flex min-h-9 min-w-0 items-center rounded-l-full transition-colors"
        >
          <span className="truncate">{crumb.label}</span>
        </Link>

        <button
          ref={trigger}
          type="button"
          aria-label={crumb.opens}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={toggle}
          className="group-hover:border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-r-full border-l border-transparent transition-colors"
        >
          <ChevronsUpDown className="size-4 shrink-0" aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          // Anchored to the left edge, since a crumb sits at the start of the
          // row rather than the end of it.
          className="bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border"
        >
          <ul className="max-h-72 overflow-y-auto">
            {crumb.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    onClick={close}
                    className={`${ITEM} ${item.current ? ON : OFF}`}
                  >
                    {item.icon ? <item.icon className="size-4 shrink-0" aria-hidden /> : null}
                    <span className="truncate">{item.label}</span>
                    {item.current ? (
                      <Check className="ml-auto size-4 shrink-0" aria-hidden />
                    ) : null}
                  </Link>
                ) : (
                  <span className={`${ITEM} ${DEAD}`}>
                    {item.icon ? <item.icon className="size-4 shrink-0" aria-hidden /> : null}
                    <span className="truncate">{item.label}</span>
                    <span className="text-label-sm ml-auto shrink-0">Coming soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
