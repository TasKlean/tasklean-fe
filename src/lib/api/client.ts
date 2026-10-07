// The only module that talks to the Spring API, and the only one that knows the
// response envelope exists. Callers get `data`, typed, or an ApiError — never
// `{ success, message, data }`.
//
// Server-side only: API_BASE_URL is a server variable and the browser never
// calls Spring directly. Auth is a parameter here, not a session lookup; the
// session and single-flight refresh wrap this module later and it stays unaware
// of both.

import { ApiError, ApiResponseFormatError } from "@/lib/api/errors";
import { getEnv } from "@/lib/env";

// Every field is optional in openapi.json — none is marked `required` — so
// nothing may be assumed present, even on a 2xx.
type Envelope = {
  success?: boolean;
  message?: string | null;
  data?: unknown;
};

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  accessToken?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = getEnv().API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${suffix}`;

  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // A null or undefined scope param is a bug, but it is the caller's bug to
    // surface as a 400 from the backend rather than one this layer invents.
    if (value === null || value === undefined) continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `${url}?${serialised}` : url;
}

function isEnvelope(value: unknown): value is Envelope {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The backend sends `Retry-After` in seconds. The HTTP-date form is legal but
// not something this API produces, so it is not handled; an unparseable or
// absent header yields null rather than a guess.
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, accessToken, headers = {}, signal } = options;

  const requestHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    // Never let a per-user API response land in a shared cache.
    cache: "no-store",
  });

  // Parsed from text, not response.json(), so an empty body is distinguishable
  // from malformed JSON. Parsing is unconditional because the backend renders
  // every failure as envelope JSON too, never HTML.
  const raw = await response.text();
  let parsed: unknown = undefined;
  if (raw.trim() !== "") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // A non-JSON body means something other than this API answered — a proxy,
      // or API_BASE_URL pointing somewhere wrong. On an error status the status
      // is still the useful signal, so it stays an ApiError.
      if (!response.ok) {
        throw new ApiError(
          response.status,
          `Request failed with status ${response.status}.`,
          parseRetryAfter(response.headers.get("Retry-After")),
        );
      }
      throw new ApiResponseFormatError(
        response.status,
        "API returned a non-JSON body where the response envelope was expected.",
      );
    }
  }

  const envelope = isEnvelope(parsed) ? parsed : undefined;
  const message = typeof envelope?.message === "string" ? envelope.message : null;

  // Any 2xx is success. POSTs really return 201 while the spec declares 200, and
  // 404/409 are absent from the spec entirely though both occur — so the exact
  // code is never the thing branched on.
  if (!response.ok) {
    throw new ApiError(
      response.status,
      message ?? `Request failed with status ${response.status}.`,
      parseRetryAfter(response.headers.get("Retry-After")),
    );
  }

  // An empty 2xx body is tolerated and yields undefined, for a caller typed
  // `request<void>`; a 2xx that carries a body must be the envelope.
  if (raw.trim() === "") return undefined as T;
  if (!envelope) {
    throw new ApiResponseFormatError(
      response.status,
      "API returned a 2xx body that is not the response envelope.",
    );
  }

  return envelope.data as T;
}
