/**
 * What the panel's own presses report back. The reader draws the line, but
 * either of them may raise one: a round recorded from the footer, and one
 * recorded in the view that takes a note and proof.
 */

export type PanelNotice = {
  tone: "success" | "error";
  text: string;
};
