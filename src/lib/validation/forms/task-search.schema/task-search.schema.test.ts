import { describe, expect, it } from "vitest";
import { QUERY_MAX_LENGTH } from "@/lib/validation/rules/rules";
import { parseTaskSearch } from "@/lib/validation/forms/task-search.schema/task-search.schema";

describe("parseTaskSearch", () => {
  it("takes a trimmed query", () => {
    const parsed = parseTaskSearch({ groupUid: "g1", q: "  bins " });

    expect(parsed.ok && parsed.values.q).toBe("bins");
  });

  it("reads an empty box as no query at all", () => {
    const parsed = parseTaskSearch({ groupUid: "g1", q: "   " });

    expect(parsed.ok && parsed.values.q).toBeUndefined();
  });

  it("refuses a query the backend would answer with a 400", () => {
    const parsed = parseTaskSearch({ groupUid: "g1", q: "x".repeat(QUERY_MAX_LENGTH + 1) });

    expect(parsed.ok).toBe(false);
  });

  it("refuses a search naming no group", () => {
    expect(parseTaskSearch({ q: "bins" }).ok).toBe(false);
  });
});
