import { describe, expect, it } from "vitest";
import {
  DEFAULT_SORT,
  groupApiQuery,
  groupQuery,
  groupQueryParams,
  narrowsList,
} from "@/lib/groups/filter/filter";
import type { GroupQuery } from "@/lib/groups/filter/filter.types";

function query(fields: Partial<GroupQuery> = {}): GroupQuery {
  return { q: "", show: ["admin", "member"], sort: DEFAULT_SORT, ...fields };
}

describe("groupQuery", () => {
  it("reads a search, the roles asked for and the order", () => {
    expect(groupQuery({ q: "  flat  ", show: ["admin", "member"], sort: "members-desc" })).toEqual({
      q: "flat",
      show: ["admin", "member"],
      sort: "members-desc",
    });
  });

  it("falls back to showing everything, name first", () => {
    expect(groupQuery({})).toEqual({ q: "", show: ["admin", "member"], sort: "name-asc" });
  });

  it("reads a URL asking for neither side as both", () => {
    expect(groupQuery({ show: [] }).show).toEqual(["admin", "member"]);
  });

  it("drops a sort and a role it does not recognise", () => {
    expect(groupQuery({ sort: "price-asc", show: ["owner", "member"] })).toEqual({
      q: "",
      show: ["member"],
      sort: "name-asc",
    });
  });

  it("reads a URL asking only for roles it does not recognise as both sides", () => {
    expect(groupQuery({ show: ["owner"] }).show).toEqual(["admin", "member"]);
  });

  it("takes one value from a param that arrived repeated", () => {
    expect(groupQuery({ q: ["flat", "house"] }).q).toBe("flat");
  });

  it("keeps the same role asked for twice once", () => {
    expect(groupQuery({ show: ["admin", "admin"] }).show).toEqual(["admin"]);
  });

  it("caps a search somebody pasted", () => {
    expect(groupQuery({ q: "x".repeat(300) }).q).toHaveLength(100);
  });
});

describe("groupQueryParams", () => {
  it("writes only what is not the default", () => {
    expect(groupQueryParams(query()).toString()).toBe("");
    expect(groupQueryParams(query({ q: "flat 12" })).toString()).toBe("q=flat+12");
    expect(groupQueryParams(query({ show: ["admin"] })).toString()).toBe("show=admin");
    expect(groupQueryParams(query({ sort: "members-desc" })).toString()).toBe("sort=members-desc");
  });

  it("round-trips through the parser", () => {
    const asked = query({ q: "beach", show: ["member"], sort: "joined-desc" });
    const params = groupQueryParams(asked);

    expect(
      groupQuery({
        q: params.get("q") ?? undefined,
        show: params.getAll("show"),
        sort: "joined-desc",
      }),
    ).toEqual(asked);
  });
});

describe("groupApiQuery", () => {
  it("asks for nothing when nothing was asked of the list", () => {
    expect(groupApiQuery(query())).toEqual({});
  });

  it("names every order the way the backend does", () => {
    expect(groupApiQuery(query({ sort: "name-desc" })).sort).toBe("NAME_DESC");
    expect(groupApiQuery(query({ sort: "joined-desc" })).sort).toBe("JOINED_DESC");
    expect(groupApiQuery(query({ sort: "created-desc" })).sort).toBe("CREATED_DESC");
    expect(groupApiQuery(query({ sort: "members-desc" })).sort).toBe("MEMBERS_DESC");
  });

  it("names no order for the default one, which is the endpoint's own", () => {
    expect(groupApiQuery(query({ sort: "name-asc" })).sort).toBeUndefined();
  });

  it("names each side of the list by its role", () => {
    expect(groupApiQuery(query({ show: ["admin"] })).role).toEqual(["GROUP_ADMIN"]);
    expect(groupApiQuery(query({ show: ["member"] })).role).toEqual(["GROUP_MEMBER"]);
  });

  it("names no role when both sides are on", () => {
    expect(groupApiQuery(query({ show: ["admin", "member"] })).role).toBeUndefined();
  });

  it("sends the search exactly as it was read", () => {
    expect(groupApiQuery(query({ q: "beach" })).q).toBe("beach");
  });
});

describe("narrowsList", () => {
  it("counts a search and a role box, and never an order", () => {
    expect(narrowsList(query())).toBe(false);
    expect(narrowsList(query({ sort: "members-desc" }))).toBe(false);
    expect(narrowsList(query({ q: "beach" }))).toBe(true);
    expect(narrowsList(query({ show: ["admin"] }))).toBe(true);
  });
});
