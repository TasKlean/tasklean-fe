import { describe, expect, it } from "vitest";
import { asBoardView } from "@/lib/tasks/view/view";

describe("asBoardView", () => {
  it.each(["list", "cards"])("keeps %j", (value) => {
    expect(asBoardView(value)).toBe(value);
  });

  it.each([undefined, "", "grid", "LIST", "../etc"])(
    "falls back to the list for %j, which the cookie may well hold",
    (value) => {
      expect(asBoardView(value)).toBe("list");
    },
  );
});
