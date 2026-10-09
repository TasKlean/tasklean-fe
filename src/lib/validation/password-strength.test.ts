import { describe, expect, it } from "vitest";
import { scorePassword } from "@/lib/validation/password-strength";

describe("scorePassword", () => {
  it.each(["", "chores", "chores12", "CHORES12", "aaaaaaaaaaaa", "abcdefghij", "9876543210"])(
    "rates %j weak",
    (value) => {
      expect(scorePassword(value)).toBe("weak");
    },
  );

  it.each(["Password1!", "P@ssw0rd", "Password123!", "Qwerty123!"])(
    "rates the guessable %j weak despite meeting rules",
    (value) => {
      expect(scorePassword(value)).toBe("weak");
    },
  );

  it.each(["Ab1!cdef", "Chores12!", "Chores123", "Tidy42!x"])("rates %j good", (value) => {
    expect(scorePassword(value)).toBe("good");
  });

  it.each(["Tidy-Kitchen-2026", "Chores2026!home", "HouseholdRota42!"])(
    "rates %j strong",
    (value) => {
      expect(scorePassword(value)).toBe("strong");
    },
  );

  it("never calls an unsubmittable password strong, however long", () => {
    expect(scorePassword("tidykitchenrota42")).toBe("weak");
    expect(scorePassword("Tidykitchenrota42")).toBe("good");
  });

  it("rates a long passphrase strong now that the cap is 64", () => {
    expect(scorePassword("Correct-Horse-Battery-Staple-2026")).toBe("strong");
  });

  it("rates a short password meeting every rule as good, not strong", () => {
    expect(scorePassword("Ab1!cdef")).toBe("good");
    expect(scorePassword("Ab1!cdefghij")).toBe("strong");
  });
});
