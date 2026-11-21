import { describe, expect, it } from "vitest";
import {
  echoCategory,
  parseCreateCategory,
  parseEditCategory,
  validateCategory,
} from "@/lib/validation/forms/category.schema/category.schema";

describe("parseCreateCategory", () => {
  it("takes the group from the form, since the path carries none", () => {
    const parsed = parseCreateCategory({
      groupUid: "g1",
      name: "  Deep   clean ",
      color: "#43AA8B",
      icon: "bath",
    });

    expect(parsed).toEqual({
      ok: true,
      values: { groupUid: "g1", name: "Deep clean", color: "#43aa8b", icon: "bath" },
    });
  });

  it("drops the icon when nothing was picked, rather than sending it blank", () => {
    const parsed = parseCreateCategory({
      groupUid: "g1",
      name: "Kitchen",
      color: "#43aa8b",
      icon: "",
    });

    expect(parsed.ok && parsed.values.icon).toBeUndefined();
  });

  it("refuses a submission naming no group", () => {
    const parsed = parseCreateCategory({ name: "Kitchen", color: "#43aa8b" });

    expect(parsed).toEqual({ ok: false, errors: { groupUid: "Pick a group." } });
  });
});

describe("parseEditCategory", () => {
  it("turns the posted id into the number the path takes", () => {
    const parsed = parseEditCategory({
      groupUid: "g1",
      id: "7",
      name: "Kitchen",
      color: "#43aa8b",
    });

    expect(parsed.ok && parsed.values.id).toBe(7);
  });

  it("refuses a save naming no category", () => {
    const parsed = parseEditCategory({ groupUid: "g1", name: "Kitchen", color: "#43aa8b" });

    expect(parsed.ok).toBe(false);
  });
});

describe("echoCategory", () => {
  it("keeps what was typed, so a refused submit without JS loses nothing", () => {
    expect(echoCategory({ name: " Kitchen ", color: "#43aa8b", icon: "bath" })).toEqual({
      name: "Kitchen",
      color: "#43aa8b",
      icon: "bath",
    });
  });

  it("answers with empty fields for a submission it cannot read", () => {
    expect(echoCategory(null)).toEqual({ name: "", color: "", icon: "" });
  });
});

describe("validateCategory", () => {
  it("reports the name and the colour separately", () => {
    expect(validateCategory({ name: "", color: "teal", icon: "" })).toEqual({
      name: "Enter a name for the category.",
      color: "Pick a colour.",
    });
  });

  it("says nothing about a category that is ready to save", () => {
    expect(validateCategory({ name: "Kitchen", color: "#43aa8b", icon: "" })).toEqual({});
  });
});
