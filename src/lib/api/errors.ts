// The one error type the API layer throws. Carries the HTTP status and the
// backend's own `message`, which is written for humans on 400/403/409 — so it
// must survive to the UI rather than being replaced with "Something went wrong".

export class ApiError extends Error {
  readonly status: number;
  // Only set on 429, and only when the backend actually sent the header. The
  // OpenAPI spec documents no response headers at all, so absence is normal.
  readonly retryAfterSeconds: number | null;

  constructor(status: number, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Thrown when a response isn't the envelope we require — an empty body on a
// status that should carry one, or a non-JSON body. The backend renders even a
// 404 on an unknown route and a 429 from the rate limiter as envelope JSON, so
// this means something other than the API answered (a proxy, a misconfigured
// API_BASE_URL) and is worth distinguishing from a real API failure.
export class ApiResponseFormatError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiResponseFormatError";
    this.status = status;
  }
}
