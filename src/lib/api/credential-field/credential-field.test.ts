import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { refusedCredential } from "@/lib/api/credential-field/credential-field";

describe("refusedCredential", () => {
  it("names the password field when the backend refused the password", () => {
    const error = new ApiError(401, "Current password is incorrect", null, "PASSWORD_INVALID");

    expect(refusedCredential(error)).toEqual({
      field: "password",
      message: "Current password is incorrect",
    });
  });

  it("names the code field when the backend refused the code", () => {
    const error = new ApiError(401, "That code is not valid.", null, "TWO_FACTOR_CODE_INVALID");

    expect(refusedCredential(error)).toEqual({
      field: "code",
      message: "That code is not valid.",
    });
  });

  it("blames no field for a 401 that carried no code, which is a dead session", () => {
    expect(refusedCredential(new ApiError(401, "Unauthorized"))).toBeNull();
  });

  it("blames no field for a refusal that is not a 401", () => {
    expect(refusedCredential(new ApiError(403, "Forbidden", null, "PASSWORD_INVALID"))).toBeNull();
  });

  it("blames no field for something that is not an ApiError", () => {
    expect(refusedCredential(new Error("fetch failed"))).toBeNull();
  });
});
