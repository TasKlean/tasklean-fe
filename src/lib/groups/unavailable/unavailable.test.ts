import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";

describe("isGroupUnavailable", () => {
  it.each([403, 404])("treats %i as a group the reader may not see", (status) => {
    expect(isGroupUnavailable(new ApiError(status, "Access denied"))).toBe(true);
  });

  it.each([400, 409, 429, 500])("leaves %i to be reported as itself", (status) => {
    expect(isGroupUnavailable(new ApiError(status, "Nope"))).toBe(false);
  });

  it("says nothing about a failure that was not an ApiError", () => {
    expect(isGroupUnavailable(new Error("network"))).toBe(false);
  });
});

describe("GROUP_UNAVAILABLE_PATH", () => {
  it("bounces to the group list with the notice asked for", () => {
    expect(GROUP_UNAVAILABLE_PATH).toBe("/app?unavailable=1");
  });
});
