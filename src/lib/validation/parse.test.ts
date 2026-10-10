import { describe, expect, it } from "vitest";
import * as z from "zod/mini";
import { firstErrors, parseWith } from "@/lib/validation/parse";

const schema = z.object({
  name: z.string().check(z.minLength(1, "Enter a name.")),
  age: z.string().check(z.regex(/^\d+$/, "Digits only.")),
});

describe("firstErrors", () => {
  it("keeps the first message for a field", () => {
    const errors = firstErrors([
      { path: ["name"], message: "first" },
      { path: ["name"], message: "second" },
    ]);
    expect(errors).toEqual({ name: "first" });
  });

  it("ignores issues with no field", () => {
    expect(firstErrors([{ path: [], message: "whole form" }])).toEqual({});
  });
});

describe("parseWith", () => {
  it("returns the parsed values when the schema passes", () => {
    const result = parseWith(schema, { name: "Ada", age: "36" });
    expect(result).toEqual({ ok: true, values: { name: "Ada", age: "36" } });
  });

  it("returns one message per failing field", () => {
    const result = parseWith(schema, { name: "", age: "x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({ name: "Enter a name.", age: "Digits only." });
  });
});
