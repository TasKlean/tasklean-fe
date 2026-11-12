import { describe, expect, it } from "vitest";
import {
  accountFilter,
  allowedActor,
  auditFilter,
  auditFilterParams,
  auditFilterQuery,
  narrowsTrail,
  pinnedLabel,
} from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const ZONE = "Europe/Ljubljana";

function filter(fields: Partial<AuditFilter> = {}): AuditFilter {
  return { type: null, ref: "", actor: "", from: "", to: "", ...fields };
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

  it("reads a range of real days, and ignores one that is not", () => {
    expect(auditFilter({ from: "2026-11-02", to: "2026-11-09" })).toEqual(
      filter({ from: "2026-11-02", to: "2026-11-09" }),
    );
    expect(auditFilter({ from: "2026-02-31", to: "yesterday" })).toEqual(filter());
  });

  it("drops a range that reads backwards, which the endpoint refuses as a 400", () => {
    expect(auditFilter({ from: "2026-11-09", to: "2026-11-02" })).toEqual(filter());
  });

  it("keeps one end of the range without the other", () => {
    expect(auditFilter({ from: "2026-11-02" })).toEqual(filter({ from: "2026-11-02" }));
    expect(auditFilter({ to: "2026-11-02" })).toEqual(filter({ to: "2026-11-02" }));
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

describe("narrowsTrail", () => {
  it("is true for any one axis, and false for the whole trail", () => {
    expect(narrowsTrail(filter())).toBe(false);
    expect(narrowsTrail(filter({ type: "task" }))).toBe(true);
    expect(narrowsTrail(filter({ actor: "u2" }))).toBe(true);
    expect(narrowsTrail(filter({ from: "2026-11-02" }))).toBe(true);
    expect(narrowsTrail(filter({ to: "2026-11-02" }))).toBe(true);
  });
});

describe("auditFilterQuery", () => {
  it("maps the URL's token to the endpoint's enum", () => {
    expect(auditFilterQuery(filter({ type: "member", ref: "m1" }), ZONE)).toEqual({
      entityType: "GROUP_MEMBER",
      entityRef: "m1",
    });
    expect(auditFilterQuery(filter({ type: "completion" }), ZONE)).toEqual({
      entityType: "TASK_COMPLETION",
    });
  });

  it("sends an actor as its own parameter, alongside an entity or on its own", () => {
    expect(auditFilterQuery(filter({ actor: "u2" }), ZONE)).toEqual({ actorRef: "u2" });
    expect(auditFilterQuery(filter({ type: "task", ref: "t1", actor: "u2" }), ZONE)).toEqual({
      entityType: "TASK",
      entityRef: "t1",
      actorRef: "u2",
    });
  });

  it("turns the reader's days into instants, the ceiling being the next day's start", () => {
    expect(auditFilterQuery(filter({ from: "2026-11-02", to: "2026-11-09" }), ZONE)).toEqual({
      dateFrom: "2026-11-01T23:00:00.000Z",
      dateTo: "2026-11-09T23:00:00.000Z",
    });
  });

  it("reads the same range differently for a reader in another zone", () => {
    expect(auditFilterQuery(filter({ from: "2026-11-02", to: "2026-11-02" }), "UTC")).toEqual({
      dateFrom: "2026-11-02T00:00:00.000Z",
      dateTo: "2026-11-03T00:00:00.000Z",
    });
  });

  it("sends one end of the range without the other", () => {
    expect(auditFilterQuery(filter({ from: "2026-11-02" }), "UTC")).toEqual({
      dateFrom: "2026-11-02T00:00:00.000Z",
    });
    expect(auditFilterQuery(filter({ to: "2026-11-02" }), "UTC")).toEqual({
      dateTo: "2026-11-03T00:00:00.000Z",
    });
  });

  it("asks for nothing when nothing is filtered", () => {
    expect(auditFilterQuery(filter(), ZONE)).toEqual({});
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

  it("writes the range it was given, and nothing for a filter that has none", () => {
    expect(auditFilterParams(filter({ from: "2026-11-02", to: "2026-11-09" })).toString()).toBe(
      "from=2026-11-02&to=2026-11-09",
    );
    expect(auditFilterParams({ type: "group", ref: "g1" }).toString()).toBe("type=group&ref=g1");
  });

  it("writes an actor with or without a kind beside it", () => {
    expect(auditFilterParams(filter({ actor: "u2" })).toString()).toBe("actor=u2");
    expect(auditFilterParams(filter({ type: "task", actor: "u2" })).toString()).toBe(
      "type=task&actor=u2",
    );
  });
});

describe("accountFilter", () => {
  it("reads the range and nothing else, since nothing else narrows an account", () => {
    expect(accountFilter({ from: "2026-11-02", to: "2026-11-09" })).toEqual(
      filter({ from: "2026-11-02", to: "2026-11-09" }),
    );
  });

  it("ignores a kind, a ref and an actor a typed URL carries", () => {
    expect(accountFilter({ type: "member", ref: "m1", actor: "u2" })).toEqual(filter());
  });

  it("drops a range that reads backwards, which the endpoint refuses", () => {
    expect(accountFilter({ from: "2026-11-09", to: "2026-11-02" })).toEqual(filter());
  });
});

describe("pinnedLabel", () => {
  it("names the thing where the screen knew it, and the kind where it did not", () => {
    expect(pinnedLabel("member", "Dan Petric")).toBe("Member: Dan Petric");
    expect(pinnedLabel("member", null)).toBe("One member");
  });
});
