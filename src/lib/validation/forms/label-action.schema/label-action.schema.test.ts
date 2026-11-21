import { describe, expect, it } from "vitest";
import { parseLabelAction } from "@/lib/validation/forms/label-action.schema/label-action.schema";

describe("parseLabelAction", () => {
  it("reads the label and the group a deletion was pressed for", () => {
    expect(parseLabelAction({ groupUid: "g1", id: "7" })).toEqual({
      ok: true,
      values: { groupUid: "g1", id: 7 },
    });
  });

  it.each([
    [{ id: "7" }, "groupUid"],
    [{ groupUid: "g1" }, "id"],
  ])("refuses %j, which is missing its %s", (input, field) => {
    const parsed = parseLabelAction(input);

    expect(parsed.ok).toBe(false);
    expect(parsed.ok === false && Object.keys(parsed.errors)).toEqual([field]);
  });
});
