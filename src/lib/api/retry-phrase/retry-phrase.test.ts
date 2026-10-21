import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";

describe("rateLimitMessage", () => {
  it("rounds the window up to whole minutes", () => {
    expect(rateLimitMessage(new ApiError(429, "Too many attempts.", 61))).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
  });

  it("says one minute in the singular", () => {
    expect(rateLimitMessage(new ApiError(429, "Slow down.", 60))).toBe(
      "Slow down. Please try again in 1 minute.",
    );
  });

  it("stays vague under a minute", () => {
    expect(rateLimitMessage(new ApiError(429, "Slow down.", 45))).toBe(
      "Slow down. Please try again shortly.",
    );
  });

  it("stays vague when the header was missing", () => {
    expect(rateLimitMessage(new ApiError(429, "Slow down."))).toBe(
      "Slow down. Please try again shortly.",
    );
  });

  it("supplies a reason when the envelope carried none", () => {
    expect(rateLimitMessage(new ApiError(429, "", 120))).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
  });
});
