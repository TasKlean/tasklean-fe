/**
 * The pieces of one line, drawn. Our own wording reads as plain text, a name or
 * a field is set in bold and a value a change moved wears a pill, so what came
 * from the data is never mistaken for the copy around it.
 *
 * A name is a link where the feed can be narrowed to what it names, which is
 * the shortest way into the filter: the name is already on screen.
 */

import Link from "next/link";
import { Fragment } from "react";
import type { AuditPinning } from "@/lib/audit/pins/pins";
import { pinHref } from "@/lib/audit/pins/pins";
import type { AuditToken } from "@/lib/audit/tokens/tokens";

type TokenLineProps = {
  // In reading order, each piece already carrying the spacing around it.
  tokens: AuditToken[];
  // Where a name leads, and what already narrows the feed. Absent on a trail
  // with no filter of its own, such as an account's, which draws no links.
  pinning?: AuditPinning;
};

const STRONG = "text-foreground font-semibold";

// Underlined words and nothing else: a row is prose, so a border or a fill
// mid-sentence reads as chrome rather than as part of what is being said. The
// ring is the one addition, a link with no focus style being unreachable.
const LINK =
  "underline underline-offset-2 transition-colors hover:text-primary focus-visible:ring-ring focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none";

// No line height of its own: vertical padding on an inline box does not push
// the lines apart, so a pill cannot make a wrapped sentence uneven.
const PILL =
  "bg-secondary text-secondary-foreground rounded-md px-1.5 py-0.5 font-medium whitespace-nowrap";

/** Renders one piece, by what it is and by where it leads. */
function piece(token: AuditToken, key: number, pinning?: AuditPinning) {
  // A value is a fact rather than a thing to go and read about, so it is never
  // a link however the line was built.
  if (token.emphasis === "value") {
    return (
      <span key={key} className={PILL}>
        {token.text}
      </span>
    );
  }

  const href = pinning && token.pin ? pinHref(pinning, token.pin) : null;
  if (href) {
    return (
      <Link key={key} href={href} className={`${token.emphasis ? STRONG : ""} ${LINK}`}>
        {token.text}
      </Link>
    );
  }

  // A name and a field both stand out from the wording, and nothing yet asks
  // for them to stand out differently.
  if (token.emphasis) {
    return (
      <strong key={key} className={STRONG}>
        {token.text}
      </strong>
    );
  }

  return <Fragment key={key}>{token.text}</Fragment>;
}

/** Renders a line as the pieces it was built from. */
export function TokenLine({ tokens, pinning }: Readonly<TokenLineProps>) {
  return <>{tokens.map((token, index) => piece(token, index, pinning))}</>;
}
