import { describe, expect, it } from "vitest";
import { parseRenameDevice } from "@/lib/validation/forms/rename-device.schema/rename-device.schema";

describe("parseRenameDevice", () => {
  it("accepts a device and a name, trimming the name", () => {
    const parsed = parseRenameDevice({ deviceId: "7", name: "  Work laptop  " });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.values).toEqual({ deviceId: 7, name: "Work laptop" });
    }
  });

  it("refuses a name that is only whitespace", () => {
    const parsed = parseRenameDevice({ deviceId: "7", name: "   " });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.name).toBe("Enter a name for this device.");
    }
  });

  it("refuses a name longer than the backend column", () => {
    const parsed = parseRenameDevice({ deviceId: "7", name: "a".repeat(256) });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.name).toBe("Use 255 characters or fewer.");
    }
  });

  it("refuses a device id that is not a number", () => {
    const parsed = parseRenameDevice({ deviceId: "seven", name: "Work laptop" });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.deviceId).toBe("Pick a device.");
    }
  });
});
