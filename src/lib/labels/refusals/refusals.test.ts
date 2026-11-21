import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { categoryInUseMessage, labelNameTakenMessage } from "@/lib/labels/refusals/refusals";

describe("labelNameTakenMessage", () => {
  it("says only that the name is taken, never that typing it again revives one", () => {
    const message = labelNameTakenMessage(
      new ApiError(409, "Tag with this name already exists in the group"),
    );

    expect(message).toBe("That name is already taken.");
  });

  it.each([400, 403, 404, 429])("leaves %i to the generic handling", (status) => {
    expect(labelNameTakenMessage(new ApiError(status, "Nope"))).toBeNull();
  });

  it("says nothing about a failure that was not an ApiError", () => {
    expect(labelNameTakenMessage(new Error("network"))).toBeNull();
  });
});

describe("categoryInUseMessage", () => {
  it("keeps the backend's own message, which is the only place the count arrives", () => {
    const message = categoryInUseMessage(
      new ApiError(409, "This category is still used by 3 task(s) - move them first"),
    );

    expect(message).toBe("This category is still used by 3 task(s) - move them first.");
  });

  it("adds no second full stop to a message that already ends in one", () => {
    expect(categoryInUseMessage(new ApiError(409, "Still in use."))).toBe("Still in use.");
  });

  it("falls back to its own wording when the envelope carried none", () => {
    expect(categoryInUseMessage(new ApiError(409, ""))).toBe(
      "That category is still used by some tasks.",
    );
  });

  it.each([400, 403, 404])("leaves %i to the generic handling", (status) => {
    expect(categoryInUseMessage(new ApiError(status, "Nope"))).toBeNull();
  });
});
