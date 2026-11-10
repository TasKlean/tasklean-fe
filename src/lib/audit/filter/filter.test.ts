import { describe, expect, it } from "vitest";
import {
  allowedActor,
  auditFilter,
  auditFilterParams,
  auditFilterQuery,
  subjectLabel,
} from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

function filter(fields: Partial<AuditFilter> = {}): AuditFilter {
  return { type: null, ref: "", actor: "", ...fields };
}

describe("auditFilter", () => {
  it("drops a ref that arrived without a usable type, since the pair cannot be sent", () => {
    expect(auditFilter({ ref: "m1" })).toEqual(filter());
    expect(auditFilter({ type: "nonsense", ref: "m1" })).toEqual(filter());
  });

  it("reads the pair the URL carries, taking the first of a repeated key", () => {
    expect(auditFilter({ type: ["member", "task"], ref: "m1" })).toEqual(
      filter({ type: "member", ref: "m1" }),
    );
  });

  it("caps a ref at the backend's own limit rather than truncating a shorter one", () => {
    const long = auditFilter({ type: "task", ref: "t".repeat(140) });
    const exact = auditFilter({ type: "task", ref: "t".repeat(100) });

    expect(long.ref).toHaveLength(100);
    expect(exact.ref).toHaveLength(100);
  });

  it("keeps an actor without a type, since the two narrow different things", () => {
    expect(auditFilter({ actor: "u2" })).toEqual(filter({ actor: "u2" }));
    expect(auditFilter({ type: "task", actor: "u2" })).toEqual(
      filter({ type: "task", actor: "u2" }),
    );
  });

  it("caps an actor the same way, since the endpoint refuses a longer one", () => {
    expect(auditFilter({ actor: "u".repeat(140) }).actor).toHaveLength(100);
  });
});

describe("allowedActor", () => {
  it("lets an admin name anybody", () => {
    const asked = filter({ actor: "u2" });

    expect(allowedActor(asked, true, "u1")).toEqual(asked);
  });

  it("lets a member name themselves", () => {
    const asked = filter({ actor: "u1" });

    expect(allowedActor(asked, false, "u1")).toEqual(asked);
  });

  it("drops an actor a member may not ask for, which the endpoint refuses as a 403", () => {
    expect(allowedActor(filter({ actor: "u2" }), false, "u1")).toEqual(filter());
  });

  it("keeps the rest of the filter when it drops the actor", () => {
    const asked = filter({ type: "task", ref: "t1", actor: "u2" });

    expect(allowedActor(asked, false, "u1")).toEqual(filter({ type: "task", ref: "t1" }));
  });

  it("drops an actor for a reader with no session at all", () => {
    expect(allowedActor(filter({ actor: "u2" }), false, null)).toEqual(filter());
  });
});

describe("auditFilterQuery", () => {
  it("maps the URL's token to the endpoint's enum", () => {
    expect(auditFilterQuery(filter({ type: "member", ref: "m1" }))).toEqual({
      entityType: "GROUP_MEMBER",
      entityRef: "m1",
    });
    expect(auditFilterQuery(filter({ type: "completion" }))).toEqual({
      entityType: "TASK_COMPLETION",
    });
  });

  it("sends an actor as its own parameter, alongside an entity or on its own", () => {
    expect(auditFilterQuery(filter({ actor: "u2" }))).toEqual({ actorRef: "u2" });
    expect(auditFilterQuery(filter({ type: "task", ref: "t1", actor: "u2" }))).toEqual({
      entityType: "TASK",
      entityRef: "t1",
      actorRef: "u2",
    });
  });

  it("asks for nothing when nothing is filtered", () => {
    expect(auditFilterQuery(filter())).toEqual({});
  });
});

describe("auditFilterParams", () => {
  it("writes only what narrows the feed", () => {
    expect(auditFilterParams(filter({ ref: "x" })).toString()).toBe("");
    expect(auditFilterParams(filter({ type: "group" })).toString()).toBe("type=group");
    expect(auditFilterParams(filter({ type: "member", ref: "m1" })).toString()).toBe(
      "type=member&ref=m1",
    );
  });

  it("writes an actor with or without a kind beside it", () => {
    expect(auditFilterParams(filter({ actor: "u2" })).toString()).toBe("actor=u2");
    expect(auditFilterParams(filter({ type: "task", actor: "u2" })).toString()).toBe(
      "type=task&actor=u2",
    );
  });
});

describe("subjectLabel", () => {
  it("names the thing where the screen knew it, and the kind where it did not", () => {
    expect(subjectLabel("member", "Dan Petric")).toBe("Dan Petric's history");
    expect(subjectLabel("member", null)).toBe("one member's history");
  });
});
