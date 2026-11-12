import { describe, expect, it } from "vitest";
import { nameToken, plainToken, tokenText, valueToken } from "@/lib/audit/tokens/tokens";

describe("tokenText", () => {
  it("joins the pieces without adding spacing of its own", () => {
    expect(tokenText([nameToken("You"), plainToken(" set it to "), valueToken("Admin")])).toBe(
      "You set it to Admin",
    );
  });

  it("reads an empty line as nothing", () => {
    expect(tokenText([])).toBe("");
  });
});
