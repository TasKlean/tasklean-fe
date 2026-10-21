/**
 * The `/api/user-settings` contract: the values the backend stores, the types
 * they derive, and the defaults it answers with before anything is saved. No
 * `server-only` here, because the forms and their schemas read the lists too.
 */

// Enum names, not display values. The order is the order the picker offers.
export const THEMES = ["SYSTEM", "DARK", "LIGHT"] as const;

// ISO 639-1, uppercased. Lowercase one to get the BCP-47 tag.
export const LOCALES = ["EN", "DE", "SL"] as const;

export type Theme = (typeof THEMES)[number];

export type AppLocale = (typeof LOCALES)[number];

export type Preferences = {
  theme: Theme;
  locale: AppLocale;
};

// Nothing is marked `required` in openapi.json and both fields are enums, so a
// response is narrowed rather than trusted.
export type PreferencesResponse = {
  theme?: string;
  locale?: string;
};

/** Mirrors the backend's own defaults, which a read falls back to. */
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "SYSTEM",
  locale: "EN",
};

/** Narrows an unrecognised theme to the default rather than trusting it. */
export function asTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_PREFERENCES.theme;
}

/** Narrows an unrecognised locale to the default rather than trusting it. */
export function asLocale(value: unknown): AppLocale {
  return LOCALES.includes(value as AppLocale) ? (value as AppLocale) : DEFAULT_PREFERENCES.locale;
}
