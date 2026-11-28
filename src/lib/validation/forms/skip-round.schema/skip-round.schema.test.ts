import { describe, expect, it } from "vitest";
import { parseSkipRound } from "@/lib/validation/forms/skip-round.schema/skip-round.schema";

describe("parseSkipRound", () => {
  it("takes a skip with no reason at all, which the press posts", () => {
    const parsed = parseSkipRound({});

    expect(parsed).toMatchObject({ ok: true, values: {} });
  });

  it("folds the empty box a form posts into nothing", () => {
    const parsed = parseSkipRound({ note: "" });

    expect(parsed).toMatchObject({ ok: true, values: {} });
  });

  it("trims the reason, the backend storing it as typed otherwise", () => {
    const parsed = parseSkipRound({ note: "  Nobody was home  " });

    expect(parsed).toMatchObject({ ok: true, values: { note: "Nobody was home" } });
  });

  it("refuses a reason past the backend's own cap", () => {
    const parsed = parseSkipRound({ note: "x".repeat(1001) });

    expect(parsed.ok).toBe(false);
  });
});
