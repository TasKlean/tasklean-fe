import { describe, expect, it } from "vitest";
import { parseAccountPage } from "@/lib/validation/forms/account-page.schema/account-page.schema";

describe("parseAccountPage", () => {
  it("takes a cursor and a range, and nothing a press has no business sending", () => {
    const parsed = parseAccountPage({
      cursor: "c1",
      from: "2026-11-02",
      to: "2026-11-09",
      actor: "u2",
    });

    expect(parsed.ok && parsed.values).toEqual({
      cursor: "c1",
      from: "2026-11-02",
      to: "2026-11-09",
    });
  });

  it("reads a press that names no page as the first one", () => {
    const parsed = parseAccountPage({});

    expect(parsed.ok && parsed.values).toEqual({
      cursor: undefined,
      from: undefined,
      to: undefined,
    });
  });

  it("refuses a day that is not one", () => {
    const parsed = parseAccountPage({ from: "last tuesday" });

    expect(parsed.ok).toBe(false);
  });
});
