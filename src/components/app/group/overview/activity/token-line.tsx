/**
 * The pieces of one line, drawn. Our own wording reads as plain text, a name or
 * a field is set in bold and a value a change moved wears a pill, so what came
 * from the data is never mistaken for the copy around it.
 */

import { Fragment } from "react";
import type { AuditToken } from "@/lib/audit/tokens/tokens";

type TokenLineProps = {
  // In reading order, each piece already carrying the spacing around it.
  tokens: AuditToken[];
};

const STRONG = "text-foreground font-semibold";
// No line height of its own: vertical padding on an inline box does not push
// the lines apart, so a pill cannot make a wrapped sentence uneven.
const PILL =
  "bg-secondary text-secondary-foreground rounded-md px-1.5 py-0.5 font-medium whitespace-nowrap";

/** Renders one piece, by what it is. */
function piece(token: AuditToken, key: number) {
  if (token.emphasis === "value") {
    return (
      <span key={key} className={PILL}>
        {token.text}
      </span>
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
export function TokenLine({ tokens }: Readonly<TokenLineProps>) {
  return <>{tokens.map((token, index) => piece(token, index))}</>;
}
