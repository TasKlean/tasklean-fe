import * as z from "zod/mini";
import { describe, expect, it } from "vitest";
import { isGuessable, passwordRequirements } from "@/lib/validation/password/policy";
import { parseWith } from "@/lib/validation/parse";
import { passwordRule } from "@/lib/validation/rules";
import contract from "@/test/password-policy-vectors.json";

const schema = z.object({ password: passwordRule });

const vectors: { password: string | null; message: string | null }[] = contract.vectors;

function firstFailure(password: string | null): string | null {
  const result = parseWith(schema, { password });
  return result.ok ? null : (result.errors.password ?? null);
}

describe("password policy contract", () => {
  it("ships the vectors the backend publishes", () => {
    expect(vectors.length).toBeGreaterThan(0);
    expect(contract.description).toContain("tasklean-be");
  });

  it.each(vectors.map((vector) => [vector.password, vector.message] as const))(
    "reports %j as %j",
    (password, message) => {
      expect(firstFailure(password)).toBe(message);
    },
  );
});

describe("password policy contract, the accepted passwords", () => {
  const accepted = vectors
    .filter((vector) => vector.message === null)
    .map((vector) => vector.password ?? "");

  it.each(accepted)("meets every rule in the meter for %j", (password) => {
    expect(Object.values(passwordRequirements(password)).every(Boolean)).toBe(true);
  });

  it.each(accepted)("is not treated as guessable for %j", (password) => {
    expect(isGuessable(password)).toBe(false);
  });
});
