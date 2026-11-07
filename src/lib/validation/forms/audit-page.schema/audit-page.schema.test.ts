import { describe, expect, it } from "vitest";
import { parseAuditPage } from "@/lib/validation/forms/audit-page.schema/audit-page.schema";

describe("parseAuditPage", () => {
  it("drops a blank cursor rather than asking for an empty page", () => {
    const parsed = parseAuditPage({ groupUid: "g1", cursor: "" });

    expect(parsed.ok && parsed.values.cursor).toBeUndefined();
  });

  it("refuses a cursor longer than the backend's column", () => {
    const parsed = parseAuditPage({ groupUid: "g1", cursor: "c".repeat(129) });

    expect(parsed.ok).toBe(false);
  });

  it("needs the group, since an action never sees the route", () => {
    expect(parseAuditPage({ cursor: "c1" }).ok).toBe(false);
  });

  it("carries the filter the cursor was issued under", () => {
    const parsed = parseAuditPage({ groupUid: "g1", cursor: "c1", type: "member", ref: "m1" });

    expect(parsed.ok && parsed.values).toEqual({
      groupUid: "g1",
      cursor: "c1",
      type: "member",
      ref: "m1",
    });
  });

  it("refuses a type that is not one of the trail's own", () => {
    expect(parseAuditPage({ groupUid: "g1", type: "user" }).ok).toBe(false);
  });
});
