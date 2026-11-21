import type { ReactNode } from "react";

export type SwatchOption = {
  // What the hidden input posts for this choice.
  value: string;
  // The option's only name, since a swatch holds nothing to read.
  label: string;
  // What the cell draws, and what the closed trigger draws once it is chosen.
  content: ReactNode;
};

export type SwatchSelectProps = {
  // The field name the form posts, carried by a hidden input.
  name: string;
  // Names the control, and prefixes the trigger's own name: "Colour: Teal".
  label: string;
  value: string;
  options: readonly SwatchOption[];
  // What the trigger draws for a stored value none of the options holds, which
  // a colour chosen before this palette existed is.
  fallback: ReactNode;
  onChange: (value: string) => void;
};
