/**
 * The error types the API layer throws. Both carry the HTTP status; `ApiError`
 * also carries the backend's own `message`, which is written for humans on
 * 400/403/409 and must reach the UI intact.
 */

export class ApiError extends Error {
  readonly status: number;

  // Only present on 429, and only when the backend sent the header — the
  // OpenAPI spec documents no response headers at all, so absence is normal.
  readonly retryAfterSeconds: number | null;

  constructor(status: number, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Narrows an unknown caught value to `ApiError`.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Thrown when a response is not the envelope at all — a non-JSON body, or a 2xx
 * body that isn't an object. The backend renders every failure as envelope JSON,
 * so this means something else answered: a proxy, or a misconfigured
 * `API_BASE_URL`. A different bug with a different fix, hence a different type.
 */
export class ApiResponseFormatError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiResponseFormatError";
    this.status = status;
  }
}
