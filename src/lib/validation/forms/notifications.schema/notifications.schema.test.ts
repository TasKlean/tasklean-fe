import { describe, expect, it } from "vitest";
import { parseNotifications } from "@/lib/validation/forms/notifications.schema/notifications.schema";

describe("parseNotifications", () => {
  it("accepts a list per channel", () => {
    const parsed = parseNotifications({
      inApp: ["TASK_ASSIGNED", "TASK_REMINDER"],
      email: ["TASK_ASSIGNED"],
    });

    expect(parsed).toEqual({
      ok: true,
      values: { inApp: ["TASK_ASSIGNED", "TASK_REMINDER"], email: ["TASK_ASSIGNED"] },
    });
  });

  it("accepts everything being off", () => {
    expect(parseNotifications({ inApp: [], email: [] }).ok).toBe(true);
  });

  it("refuses a type the backend does not have", () => {
    expect(parseNotifications({ inApp: ["GROUP_DELETED"], email: [] }).ok).toBe(false);
  });

  it("refuses a channel that is not a list", () => {
    expect(parseNotifications({ inApp: "TASK_ASSIGNED", email: [] }).ok).toBe(false);
  });

  it("refuses a submission with a channel missing", () => {
    expect(parseNotifications({ inApp: [] }).ok).toBe(false);
  });
});
