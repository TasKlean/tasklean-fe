import { describe, expect, it } from "vitest";
import { humanise, humanisedConstant } from "@/lib/text/humanise/humanise";

describe("humanise", () => {
  it("words a constant the code has no words for", () => {
    expect(humanise("IN_PROGRESS")).toBe("In progress");
  });

  it("splits a camelCase field name", () => {
    expect(humanise("estimatedTimeMinutes")).toBe("Estimated time minutes");
  });

  it("keeps a digit with the word it belongs to", () => {
    expect(humanise("TWO_FACTOR_2")).toBe("Two factor 2");
  });
});

describe("humanisedConstant", () => {
  it("leaves a stored colour alone, which is not an enum", () => {
    expect(humanisedConstant("#43aa8b")).toBe("#43aa8b");
  });

  it("words anything shaped like one of the backend's constants", () => {
    expect(humanisedConstant("WEEKLY")).toBe("Weekly");
  });
});
