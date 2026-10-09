import { describe, expect, it } from "vitest";
import { validateRegister, type RegisterFields } from "@/lib/validation/register";

const VALID: RegisterFields = {
  name: "Maja",
  lastName: "Novak",
  email: "maja@example.com",
  password: "Chores12!",
  confirmPassword: "Chores12!",
};

describe("validateRegister", () => {
  it("returns no errors for a complete form", () => {
    expect(validateRegister(VALID)).toEqual({});
  });

  it.each(["name", "lastName"] as const)("requires %s", (field) => {
    expect(validateRegister({ ...VALID, [field]: "   " })[field]).toBeTruthy();
  });

  it("rejects a space inside the first name", () => {
    expect(validateRegister({ ...VALID, name: "Mary Jane" }).name).toBe(
      "Use one word, without spaces.",
    );
  });

  it.each(["Van Der Berg", "De La Cruz", "Novak Kovac"])(
    "accepts the spaced surname %j",
    (value) => {
      expect(validateRegister({ ...VALID, lastName: value }).lastName).toBeUndefined();
    },
  );

  it.each(["name", "lastName"] as const)("ignores surrounding whitespace in %s", (field) => {
    expect(validateRegister({ ...VALID, [field]: "  Novak  " })[field]).toBeUndefined();
  });

  it.each(["Novak-Kovac", "O'Brien", "Jose"])("still accepts %j as a last name", (value) => {
    expect(validateRegister({ ...VALID, lastName: value }).lastName).toBeUndefined();
  });

  it("rejects a malformed email", () => {
    expect(validateRegister({ ...VALID, email: "nope" }).email).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects a password under eight characters", () => {
    expect(validateRegister({ ...VALID, password: "short12" }).password).toBe(
      "Use at least 8 characters.",
    );
  });

  it("accepts a password of exactly eight characters", () => {
    expect(
      validateRegister({ ...VALID, password: "Chores1!", confirmPassword: "Chores1!" }).password,
    ).toBeUndefined();
  });

  it("requires the repeated password", () => {
    expect(validateRegister({ ...VALID, confirmPassword: "" }).confirmPassword).toBe(
      "Repeat your password.",
    );
  });

  it("rejects a repeat that does not match", () => {
    expect(validateRegister({ ...VALID, confirmPassword: "Chores12?" }).confirmPassword).toBe(
      "Passwords do not match.",
    );
  });

  it("does not trim the password before comparing", () => {
    expect(
      validateRegister({ ...VALID, password: "Chores12! ", confirmPassword: "Chores12!" })
        .confirmPassword,
    ).toBe("Passwords do not match.");
  });

  it("reports every invalid field at once", () => {
    expect(
      validateRegister({
        name: "",
        lastName: "",
        email: "nope",
        password: "",
        confirmPassword: "",
      }),
    ).toEqual({
      name: "Enter your first name.",
      lastName: "Enter your last name.",
      email: "Enter a valid email address.",
      password: "Choose a password.",
      confirmPassword: "Repeat your password.",
    });
  });
});
