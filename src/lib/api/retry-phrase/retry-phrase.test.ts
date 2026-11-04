import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";

describe("rateLimitMessage", () => {
  it("rounds the window up to whole minutes", () => {
    expect(
      rateLimitMessage(new ApiError(429, "Too many requests, please try again later", 61)),
    ).toBe("Too many attempts. Please try again in 2 minutes.");
  });

  it("says one minute in the singular", () => {
    expect(rateLimitMessage(new ApiError(429, "", 60))).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });

  it("stays vague under a minute", () => {
    expect(rateLimitMessage(new ApiError(429, "", 45))).toBe(
      "Too many attempts. Please try again shortly.",
    );
  });

  it("stays vague when the header was missing", () => {
    expect(rateLimitMessage(new ApiError(429, ""))).toBe(
      "Too many attempts. Please try again shortly.",
    );
  });

  it("says nothing twice when the backend already said to try later", () => {
    const message = rateLimitMessage(
      new ApiError(429, "Too many requests, please try again later", 45),
    );

    expect(message).toBe("Too many attempts. Please try again shortly.");
    expect(message).not.toContain("later");
  });

  it("never puts the status in what a reader sees", () => {
    expect(
      rateLimitMessage(new ApiError(429, "Request failed with status 429.", 45)),
    ).not.toContain("429");
  });
});
