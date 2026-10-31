import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { lastAdminMessage } from "@/lib/groups/last-admin/last-admin";

describe("lastAdminMessage", () => {
  it("says what happened and what to do about it", () => {
    const message = lastAdminMessage(new ApiError(409, "A group must have at least one admin"));

    expect(message).toBe("A group must have at least one admin. Make someone else an admin first.");
  });

  it("adds no second full stop to a message that already ends in one", () => {
    expect(lastAdminMessage(new ApiError(409, "Not allowed."))).toBe(
      "Not allowed. Make someone else an admin first.",
    );
  });

  it("falls back to its own wording when the envelope carried none", () => {
    expect(lastAdminMessage(new ApiError(409, ""))).toBe(
      "A group must have at least one admin. Make someone else an admin first.",
    );
  });

  it.each([400, 403, 404, 429])("leaves %i to the generic handling", (status) => {
    expect(lastAdminMessage(new ApiError(status, "Nope"))).toBeNull();
  });

  it("says nothing about a failure that was not an ApiError", () => {
    expect(lastAdminMessage(new Error("network"))).toBeNull();
  });
});
