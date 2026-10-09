import { describe, expect, it } from "vitest";
import { readRaw, readTrimmed } from "@/lib/validation/form-data";

function form(fields: Record<string, string | File>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("readTrimmed", () => {
  it("reads the named fields and trims them", () => {
    const data = form({ email: "  a@b.test  ", name: "Maja " });

    expect(readTrimmed(data, ["email", "name"])).toEqual({ email: "a@b.test", name: "Maja" });
  });

  it("gives an empty string for a field that was not submitted", () => {
    expect(readTrimmed(form({}), ["email"])).toEqual({ email: "" });
  });

  it("ignores fields that were not asked for", () => {
    const data = form({ email: "a@b.test", password: "secret" });

    expect(readTrimmed(data, ["email"])).toEqual({ email: "a@b.test" });
  });

  it("returns an empty string for a File entry rather than stringifying it", () => {
    const data = form({ email: new File(["x"], "x.txt") });

    expect(readTrimmed(data, ["email"]).email).toBe("");
  });
});

describe("readRaw", () => {
  it("leaves the value exactly as submitted", () => {
    const data = form({ password: "  Chores12!  " });

    expect(readRaw(data, ["password"])).toEqual({ password: "  Chores12!  " });
  });

  it("gives an empty string for a field that was not submitted", () => {
    expect(readRaw(form({}), ["password"])).toEqual({ password: "" });
  });
});
