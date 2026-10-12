/**
 * The only module that knows the response envelope exists. Callers get `data`,
 * typed, or an `ApiError`. Auth is a parameter, not a session lookup.
 */

import "server-only";

import type { Envelope, QueryValue, RequestOptions } from "@/lib/api/client.types";
import { ApiError, ApiResponseFormatError } from "@/lib/api/errors";
import { getEnv } from "@/lib/config/env";

/**
 * Joins the configured base URL, a path and a query object into a request URL.
 *
 * @param query Null and undefined values are dropped rather than serialised.
 * @returns An absolute URL, with no doubled slash at the join.
 */
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = getEnv().API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${suffix}`;

  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // A missing scope param is the caller's bug, best surfaced as the backend's
    // 400 rather than as an error this layer invents.
    if (value === null || value === undefined) continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `${url}?${serialised}` : url;
}

/**
 * Narrows a parsed body to the envelope shape.
 *
 * Only rejects what cannot carry fields: an array or a non-object. Every field
 * is optional, so a plain object always qualifies and the caller checks the
 * parts it needs.
 */
function isEnvelope(value: unknown): value is Envelope {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads `Retry-After` as a count of seconds.
 *
 * Seconds only: the HTTP-date form is legal but not something this API sends,
 * so an unparseable or absent header yields null rather than a guess.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

/**
 * Calls the API and unwraps the envelope.
 *
 * @param path Path from the API root, e.g. `/api/tasks`.
 * @param options Method, body, query parameters, bearer token, abort signal.
 * @returns The envelope's `data`, typed as `T`. An empty 2xx body gives
 * `undefined`, for a caller typed `request<void>`.
 * @throws ApiError on any non-2xx, carrying the backend's message when it sent one.
 * @throws ApiResponseFormatError when a 2xx body is not the envelope.
 */
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
    // Never let a per-user response land in a shared cache.
    cache: "no-store",
  });

  // Text, not .json(), so an empty body stays distinguishable from malformed
  // JSON. Unconditional: the backend renders failures as envelope JSON too.
  const raw = await response.text();
  let parsed: unknown = undefined;
  if (raw.trim() !== "") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Something other than this API answered. On an error status the status is
      // still the useful signal, so it stays an ApiError.
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
  const code = typeof envelope?.code === "string" ? envelope.code : null;

  // Any 2xx is success: POSTs return 201 though the spec says 200, and 404/409
  // are absent from the spec entirely despite both occurring.
  if (!response.ok) {
    throw new ApiError(
      response.status,
      message ?? `Request failed with status ${response.status}.`,
      parseRetryAfter(response.headers.get("Retry-After")),
      code,
    );
  }

  if (raw.trim() === "") return undefined as T;
  if (!envelope) {
    throw new ApiResponseFormatError(
      response.status,
      "API returned a 2xx body that is not the response envelope.",
    );
  }

  return envelope.data as T;
}
