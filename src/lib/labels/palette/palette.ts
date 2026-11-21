/**
 * The colours a label may be given. Hex codes rather than tokens, deliberately:
 * the value is stored on the label and has to stay exactly what it was when it
 * was chosen, where a token is free to change with the design. How the colour
 * is then painted is `label-tint` in `globals.css`.
 */

export type Swatch = {
  // What is stored and sent, lower case so two labels of the same colour match.
  value: string;
  // The swatch's only name, since a colour button holds nothing to read.
  label: string;
};

/**
 * Ten mid-tones, which is what the tint needs: the chip mixes the colour into
 * the background at a low percentage, so anything near black or white comes out
 * as no colour at all in one of the two schemes.
 */
export const SWATCHES: readonly Swatch[] = [
  { value: "#e8505b", label: "Red" },
  { value: "#f08a5d", label: "Orange" },
  { value: "#f9c74f", label: "Amber" },
  { value: "#90be6d", label: "Green" },
  { value: "#43aa8b", label: "Teal" },
  { value: "#4d96ff", label: "Blue" },
  { value: "#5c6bc0", label: "Indigo" },
  { value: "#9b5de5", label: "Purple" },
  { value: "#f15bb5", label: "Pink" },
  { value: "#6b7a8f", label: "Slate" },
];

/** What a label with no colour of its own is drawn in, and what a form starts on. */
export const DEFAULT_SWATCH = SWATCHES[0].value;

/**
 * Names a stored colour, for a control that has to say what is picked.
 *
 * @returns The swatch's name, or the code itself: a colour set before this
 * palette existed, or by another client, is still a colour to show.
 */
export function swatchLabel(color: string): string {
  return SWATCHES.find((swatch) => swatch.value === color.toLowerCase())?.label ?? color;
}
