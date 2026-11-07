import { describe, expect, it } from "vitest";
import {
  auditFilter,
  auditFilterParams,
  auditFilterQuery,
  subjectLabel,
} from "@/lib/audit/filter/filter";

describe("auditFilter", () => {
  it("drops a ref that arrived without a usable type, since the pair cannot be sent", () => {
    expect(auditFilter({ ref: "m1" })).toEqual({ type: null, ref: "" });
    expect(auditFilter({ type: "nonsense", ref: "m1" })).toEqual({ type: null, ref: "" });
  });

  it("reads the pair the URL carries, taking the first of a repeated key", () => {
    expect(auditFilter({ type: ["member", "task"], ref: "m1" })).toEqual({
      type: "member",
      ref: "m1",
    });
  });

  it("caps a ref at the backend's own limit rather than truncating a shorter one", () => {
    const long = auditFilter({ type: "task", ref: "t".repeat(140) });
    const exact = auditFilter({ type: "task", ref: "t".repeat(100) });

    expect(long.ref).toHaveLength(100);
    expect(exact.ref).toHaveLength(100);
  });
});

describe("auditFilterQuery", () => {
  it("maps the URL's token to the endpoint's enum", () => {
    expect(auditFilterQuery({ type: "member", ref: "m1" })).toEqual({
      entityType: "GROUP_MEMBER",
      entityRef: "m1",
    });
    expect(auditFilterQuery({ type: "completion", ref: "" })).toEqual({
      entityType: "TASK_COMPLETION",
    });
  });

  it("asks for nothing when nothing is filtered", () => {
    expect(auditFilterQuery({ type: null, ref: "" })).toEqual({});
  });
});

describe("auditFilterParams", () => {
  it("writes only what narrows the feed", () => {
    expect(auditFilterParams({ type: null, ref: "x" }).toString()).toBe("");
    expect(auditFilterParams({ type: "group", ref: "" }).toString()).toBe("type=group");
    expect(auditFilterParams({ type: "member", ref: "m1" }).toString()).toBe("type=member&ref=m1");
  });
});

describe("subjectLabel", () => {
  it("names the thing where the screen knew it, and the kind where it did not", () => {
    expect(subjectLabel("member", "Dan Petric")).toBe("Dan Petric's history");
    expect(subjectLabel("member", null)).toBe("one member's history");
  });
});
