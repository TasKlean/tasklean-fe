import { describe, expect, it } from "vitest";
import { fullName, initials } from "@/lib/users/name/name";

describe("fullName", () => {
  it("joins both parts", () => {
    expect(fullName("Ada", "Lovelace")).toBe("Ada Lovelace");
  });

  it("keeps a surname with an internal space whole", () => {
    expect(fullName("Marie", "Van Der Berg")).toBe("Marie Van Der Berg");
  });

  it("falls back to whichever part arrived", () => {
    expect(fullName("Ada", null)).toBe("Ada");
    expect(fullName(undefined, "Lovelace")).toBe("Lovelace");
  });

  it("treats whitespace as absent", () => {
    expect(fullName("   ", "")).toBeNull();
  });

  it("is null when the backend sent neither", () => {
    expect(fullName()).toBeNull();
  });
});

describe("initials", () => {
  it("takes one letter from each part", () => {
    expect(initials("Ada", "Lovelace")).toBe("AL");
  });

  it("uppercases a lowercase name", () => {
    expect(initials("ada", "lovelace")).toBe("AL");
  });

  it("gives a single letter when only a first name is known", () => {
    expect(initials("Ada")).toBe("A");
  });

  it("ignores leading whitespace rather than taking it as the initial", () => {
    expect(initials("  Ada")).toBe("A");
  });

  it("keeps an astral code point whole", () => {
    expect(initials("𝒜da")).toBe("𝒜");
  });

  it("is null when there is no name to take them from", () => {
    expect(initials("", null)).toBeNull();
  });
});
