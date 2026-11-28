import { describe, expect, it } from "vitest";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { actorPin, entityPin, pinHref } from "@/lib/audit/pins/pins";
import type { AuditPinning } from "@/lib/audit/pins/pins";

const PATH = "/app/groups/g1/overview/activity";

const NOTHING: AuditFilter = { type: null, ref: "", actor: "", from: "", to: "" };

function pinning(filter: Partial<AuditFilter> = {}, onlyActor: string | null = null): AuditPinning {
  return { path: PATH, onlyActor, filter: { ...NOTHING, ...filter } };
}

describe("entityPin", () => {
  it("names nothing for a kind the filter cannot ask for, which the endpoint would refuse", () => {
    expect(entityPin("USER", "u1")).toBeUndefined();
    expect(entityPin("TASK_COMPLETION", "9")).toBeUndefined();
  });

  it("keeps a category and a tag apart, which number themselves separately", () => {
    expect(entityPin("CATEGORY", "3")).toEqual({ type: "category", ref: "3" });
    expect(entityPin("TAG", "3")).toEqual({ type: "tag", ref: "3" });
  });

  it("names nothing for an entry carrying no ref at all", () => {
    expect(entityPin("TASK", null)).toBeUndefined();
  });
});

describe("actorPin", () => {
  it("names nobody for an entry with no actor, which is the system", () => {
    expect(actorPin(undefined)).toBeUndefined();
    expect(actorPin(null)).toBeUndefined();
  });
});

describe("pinHref", () => {
  it("changes the one axis the name is about and carries the rest over", () => {
    const href = pinHref(pinning({ actor: "u2", from: "2026-03-01" }), {
      type: "task",
      ref: "t1",
    });

    expect(href).toBe(`${PATH}?type=task&ref=t1&actor=u2&from=2026-03-01`);
  });

  it("replaces the thing the feed is pinned to rather than adding to it", () => {
    const href = pinHref(pinning({ type: "task", ref: "t1" }), { type: "member", ref: "m2" });

    expect(href).toBe(`${PATH}?type=member&ref=m2`);
  });

  it("draws no link to where the reader already is", () => {
    expect(pinHref(pinning({ type: "task", ref: "t1" }), { type: "task", ref: "t1" })).toBeNull();
    expect(pinHref(pinning({ actor: "u2" }), { actor: "u2" })).toBeNull();
  });

  it("refuses an actor a member may not ask for, which the endpoint answers 403 to", () => {
    const asMember = pinning({}, "u1");

    expect(pinHref(asMember, { actor: "u2" })).toBeNull();
    expect(pinHref(asMember, { actor: "u1" })).toBe(`${PATH}?actor=u1`);
  });

  it("offers an admin anybody, the roster being theirs to narrow by", () => {
    expect(pinHref(pinning(), { actor: "u2" })).toBe(`${PATH}?actor=u2`);
  });

  it("leaves a member the things, which the backend narrows for them anyway", () => {
    expect(pinHref(pinning({}, "u1"), { type: "task", ref: "t1" })).toBe(
      `${PATH}?type=task&ref=t1`,
    );
  });
});
