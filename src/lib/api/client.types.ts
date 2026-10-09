/**
 * Types for the API client.
 *
 * `Envelope` belongs to `client.ts` alone. Splitting it into this file makes it
 * importable, which the language cannot prevent — but the envelope must not
 * escape the client, so treat it as private to that module.
 */

// No field is marked `required` in openapi.json, so none may be assumed
// present — not even on a 2xx.
export type Envelope = {
  success?: boolean;
  message?: string | null;
  data?: unknown;
};

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  accessToken?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};
