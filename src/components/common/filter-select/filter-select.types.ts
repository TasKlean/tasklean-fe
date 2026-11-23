export type SelectOption = {
  value: string;
  label: string;
  // Draws a rule above this row, splitting the list into blocks. Decoration,
  // because a listbox may own nothing but options, so the keyboard steps past it.
  divider?: boolean;
};

export type FilterSelectProps = {
  // Names the control for assistive tech, since the legend beside it is not a
  // `<label>` a combobox can be tied to.
  label: string;
  name: string;
  options: readonly SelectOption[];
  value: string;
};
