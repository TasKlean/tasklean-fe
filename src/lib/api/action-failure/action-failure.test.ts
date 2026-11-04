import { describe, expect, it } from "vitest";
import { actionFailureMessage, unreachableOr } from "@/lib/api/action-failure/action-failure";
import { ApiError, ApiUnreachableError, GENERIC_FAILURE, UNREACHABLE } from "@/lib/api/errors";
import { SessionExpiredError } from "@/lib/api/server/server";

describe("actionFailureMessage", () => {
  it("shows the backend's own message", () => {
    expect(actionFailureMessage(new ApiError(409, "A Google account is linked already."))).toBe(
      "A Google account is linked already.",
    );
  });

  it("adds the window to a rate limit", () => {
    expect(actionFailureMessage(new ApiError(429, "Too many attempts.", 120))).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
  });

  it("falls back when the envelope carried no message", () => {
    expect(actionFailureMessage(new ApiError(500, ""))).toBe(GENERIC_FAILURE);
  });

  it("falls back for a failure that never reached the API", () => {
    expect(actionFailureMessage(new TypeError("fetch failed"))).toBe(GENERIC_FAILURE);
  });

  it("names an outage rather than telling them to try again", () => {
    expect(actionFailureMessage(new ApiUnreachableError())).toBe(UNREACHABLE);
  });

  it("sends a dead session to the login screen instead of returning", () => {
    let thrown: unknown;
    try {
      actionFailureMessage(new SessionExpiredError());
    } catch (error) {
      thrown = error;
    }

    expect(String((thrown as { digest?: string }).digest).split(";")[2]).toBe("/login");
  });
});

describe("unreachableOr", () => {
  it("names an outage in place of the caller's own wording", () => {
    expect(unreachableOr(new ApiUnreachableError(), "Something went wrong signing you in.")).toBe(
      UNREACHABLE,
    );
  });

  it("leaves every other throw to the caller's own wording", () => {
    expect(unreachableOr(new TypeError("boom"), "Something went wrong signing you in.")).toBe(
      "Something went wrong signing you in.",
    );
    expect(unreachableOr(new ApiError(500, ""), GENERIC_FAILURE)).toBe(GENERIC_FAILURE);
  });
});
