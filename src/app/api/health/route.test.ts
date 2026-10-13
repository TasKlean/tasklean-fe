import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health route", () => {
  it("answers 200 without reading the session or calling the API", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
