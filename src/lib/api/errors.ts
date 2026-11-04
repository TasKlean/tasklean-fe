/**
 * The error types the API layer throws, and the one line shown when a failure
 * carried nothing worth reading. `ApiError` carries the backend's own
 * `message`, written for humans on 400/403/409 and reaching the UI intact.
 *
 * The copy lives here rather than beside the actions because `client.ts` needs
 * it too, and importing the other way round is a cycle.
 */

// Never the status: a number is not a sentence, and anything answering without
// our envelope is a gateway or a wrong base URL, which a reader cannot act on.
export const GENERIC_FAILURE = "Something went wrong. Please try again.";

export const UNREACHABLE = "We could not reach TasKlean. Check your connection and try again.";

export class ApiError extends Error {
  readonly status: number;

  // Only present on 429, and only when the backend sent the header — the
  // OpenAPI spec documents no response headers at all, so absence is normal.
  readonly retryAfterSeconds: number | null;

  // The envelope's machine-readable code, on the few failures that carry one.
  readonly code: string | null;

  constructor(
    status: number,
    message: string,
    retryAfterSeconds: number | null = null,
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.code = code;
  }
}

/**
 * Narrows an unknown caught value to `ApiError`.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Thrown when the request never got an answer at all: the backend is not
 * listening, or the network is gone. Separate from `ApiError`, which means the
 * API answered and refused, and so is the one failure worth naming to a reader.
 */
export class ApiUnreachableError extends Error {
  constructor(message = UNREACHABLE) {
    super(message);
    this.name = "ApiUnreachableError";
  }
}

/**
 * Narrows an unknown caught value to `ApiUnreachableError`.
 */
export function isApiUnreachableError(error: unknown): error is ApiUnreachableError {
  return error instanceof ApiUnreachableError;
}

/**
 * Thrown when a response is not the envelope at all: a non-JSON body, or a 2xx
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
