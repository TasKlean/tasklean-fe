/**
 * Types for the API client. `Envelope` is private to `client.ts` by convention —
 * splitting it here makes it importable, which TypeScript cannot prevent.
 */

// No field is marked `required` in openapi.json, so none may be assumed
// present — not even on a 2xx.
export type Envelope = {
  success?: boolean;
  message?: string | null;
  // A stable error code on selected failures only, omitted from the JSON
  // otherwise. Branch on this rather than on the human message.
  code?: string | null;
  data?: unknown;
};

// An array is a parameter the backend takes repeated, such as the group list's
// `role`: one key with one entry each, never the entries joined into one value.
export type QueryValue = string | number | boolean | null | undefined | readonly string[];

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  accessToken?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};
