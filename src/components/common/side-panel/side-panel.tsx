/**
 * A panel over the page, anchored right and the full height of it. A sheet on
 * a phone, a sidebar from `sm`.
 *
 * **Nothing behind it is dimmed, so it is not modal**: focus is not trapped,
 * the page is not frozen and there is no scrim swallowing presses. It takes
 * focus on arrival, because it arrives by navigation and the reader needs to be
 * in it; everything behind it stays usable.
 *
 * **Escape and a press outside work only where the caller asks**, since a panel
 * holding a half-typed form must not be thrown away by a stray press or by the
 * key that dismisses the colour grid inside it. The leading control is the
 * caller's too: a link where the URL names what is open, a press where nothing
 * but state does, and an arrow rather than a cross where that press leads back
 * into the panel instead of out of it.
 */

"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { SidePanelProps } from "@/components/common/side-panel/side-panel.types";

// Above the header's `z-50` and the phone bar's `z-40`, both of which it
// covers: the panel is the whole height of the page rather than a column
// tucked under the chrome.
const BOX =
  "bg-card border-border/60 fixed inset-y-0 right-0 z-60 flex w-full flex-col border-l sm:w-[32rem] lg:w-[40rem]";

const HEAD =
  "border-border/60 px-space-md py-space-sm gap-space-sm flex min-h-16 shrink-0 items-center border-b";

const CLOSE =
  "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const MARKS = {
  close: { icon: <X className="size-5" aria-hidden />, label: "Close" },
  back: { icon: <ArrowLeft className="size-5" aria-hidden />, label: "Back" },
} as const;

/** Renders a panel anchored to the right of the page. */
export function SidePanel({
  label,
  close,
  dismissable,
  header,
  children,
}: Readonly<SidePanelProps>) {
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const href = "href" in close ? close.href : null;
  const press = "press" in close ? close.press : null;
  const mark = "press" in close && close.back ? MARKS.back : MARKS.close;

  // On arrival only. Tied to the close href as well, it fired on every render
  // and took focus back off whatever was being typed into.
  useEffect(() => {
    // The box itself, not its first control: a screen reader then announces the
    // panel's name, and Tab still leads into the first field.
    box.current?.focus();
  }, []);

  useEffect(() => {
    if (!dismissable) return;

    /** Leaves whichever way the caller named. */
    function leave() {
      if (press) press();
      else if (href) router.push(href);
    }

    // Nothing nested here stops the key from bubbling, so a panel that may be
    // dismissed has nothing open inside it that Escape means instead.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") leave();
    }

    // `pointerdown`, not `click`: a press on a link behind the panel then
    // closes this one and still follows the link, which is what was meant.
    function onPointerDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) leave();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dismissable, href, press, router]);

  return (
    <div ref={box} role="dialog" aria-label={label} tabIndex={-1} className={BOX}>
      <div className={HEAD}>
        {href ? (
          <Link href={href} aria-label={mark.label} className={CLOSE}>
            {mark.icon}
          </Link>
        ) : (
          <button
            type="button"
            onClick={press ?? undefined}
            aria-label={mark.label}
            className={CLOSE}
          >
            {mark.icon}
          </button>
        )}

        {header}
      </div>

      {children}
    </div>
  );
}
