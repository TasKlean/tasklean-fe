import { describe, expect, it } from "vitest";
import {
  echoTag,
  parseCreateTag,
  parseEditTag,
  validateTag,
} from "@/lib/validation/forms/tag.schema/tag.schema";

describe("parseCreateTag", () => {
  it("takes the group from the form, since the path carries none", () => {
    const parsed = parseCreateTag({ groupUid: "g1", name: "  Urgent ", color: "#E8505B" });

    expect(parsed).toEqual({
      ok: true,
      values: { groupUid: "g1", name: "Urgent", color: "#e8505b" },
    });
  });

  it("asks for a name in the tag's own wording", () => {
    const parsed = parseCreateTag({ groupUid: "g1", name: "", color: "#e8505b" });

    expect(parsed).toEqual({ ok: false, errors: { name: "Enter a name for the tag." } });
  });
});

describe("parseEditTag", () => {
  it("carries the name as well as the colour, which is what a member reposts", () => {
    const parsed = parseEditTag({ groupUid: "g1", id: "3", name: "Urgent", color: "#f9c74f" });

    expect(parsed.ok && parsed.values).toEqual({
      groupUid: "g1",
      id: 3,
      name: "Urgent",
      color: "#f9c74f",
    });
  });
});

describe("echoTag", () => {
  it("keeps what was typed, so a refused submit without JS loses nothing", () => {
    expect(echoTag({ name: " Urgent ", color: "#e8505b" })).toEqual({
      name: "Urgent",
      color: "#e8505b",
    });
  });
});

describe("validateTag", () => {
  it("reports the name and the colour separately", () => {
    expect(validateTag({ name: "", color: "" })).toEqual({
      name: "Enter a name for the tag.",
      color: "Pick a colour.",
    });
  });
});
