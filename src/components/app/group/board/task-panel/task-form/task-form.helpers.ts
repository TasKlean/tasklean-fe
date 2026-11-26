/**
 * What the task form's parts work out rather than draw. The stretches live
 * here because the field offers them and the editor has to tell a stored value
 * that is one of them from a typed number.
 */

// The four stretches most tasks are, in minutes.
export const ESTIMATE_PRESETS = [15, 30, 45, 60];

/** Words a stretch the way a press should read it. */
export function presetLabel(minutes: number): string {
  return minutes < 60 ? `${minutes}m` : `${minutes / 60}h`;
}

/** Reports whether a stored value is one of the stretches on offer. */
export function isPreset(value: string): boolean {
  return ESTIMATE_PRESETS.some((preset) => String(preset) === value);
}
