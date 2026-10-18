import { describe, expect, it } from "vitest";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { ApiError } from "@/lib/api/errors";
import { SessionExpiredError } from "@/lib/api/server";

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
