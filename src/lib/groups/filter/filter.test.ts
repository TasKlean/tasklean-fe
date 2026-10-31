import { describe, expect, it } from "vitest";
import {
  DEFAULT_SORT,
  filterGroups,
  groupQuery,
  groupQueryParams,
} from "@/lib/groups/filter/filter";
import type { GroupQuery } from "@/lib/groups/filter/filter.types";
import type { MyGroup } from "@/lib/groups/groups.types";

const FLAT: MyGroup = {
  uid: "g1",
  name: "Flat 12",
  description: "The upstairs kitchen",
  myRole: "GROUP_ADMIN",
  memberCount: 4,
  dateJoined: "2026-01-10T09:00:00",
  dateCreated: "2026-01-01T09:00:00",
};

const HOUSE: MyGroup = {
  uid: "g2",
  name: "Beach house",
  description: "Summers only",
  myRole: "GROUP_MEMBER",
  memberCount: 9,
  dateJoined: "2026-03-20T09:00:00",
  dateCreated: "2026-02-01T09:00:00",
};

const CABIN: MyGroup = {
  uid: "g3",
  name: "Cabin",
  myRole: "GROUP_MEMBER",
  memberCount: 2,
  dateJoined: "2026-02-15T09:00:00",
  dateCreated: "2026-03-01T09:00:00",
};

const ALL = [FLAT, HOUSE, CABIN];

function query(fields: Partial<GroupQuery> = {}): GroupQuery {
  return { q: "", show: ["admin", "member"], sort: DEFAULT_SORT, ...fields };
}

function names(groups: readonly MyGroup[]): (string | undefined)[] {
  return groups.map((group) => group.name);
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

describe("filterGroups", () => {
  it("searches the name and the description, whatever the case", () => {
    expect(names(filterGroups(ALL, query({ q: "KITCHEN" })))).toEqual(["Flat 12"]);
    expect(names(filterGroups(ALL, query({ q: "beach" })))).toEqual(["Beach house"]);
  });

  it("shows everything when both sides are on", () => {
    expect(filterGroups(ALL, query())).toHaveLength(3);
  });

  it("shows one side of the list when its box is on", () => {
    expect(names(filterGroups(ALL, query({ show: ["admin"] })))).toEqual(["Flat 12"]);
    expect(names(filterGroups(ALL, query({ show: ["member"] })))).toEqual(["Beach house", "Cabin"]);
  });

  it("treats a role we do not know as a plain membership", () => {
    const guest: MyGroup = { uid: "g4", name: "Guest", myRole: "GROUP_GUEST" };

    expect(names(filterGroups([guest], query({ show: ["member"] })))).toEqual(["Guest"]);
  });

  it("orders by name both ways", () => {
    expect(names(filterGroups(ALL, query()))).toEqual(["Beach house", "Cabin", "Flat 12"]);
    expect(names(filterGroups(ALL, query({ sort: "name-desc" })))).toEqual([
      "Flat 12",
      "Cabin",
      "Beach house",
    ]);
  });

  it("orders by when you joined, when the group was made, and by size", () => {
    expect(names(filterGroups(ALL, query({ sort: "joined-desc" })))).toEqual([
      "Beach house",
      "Cabin",
      "Flat 12",
    ]);
    expect(names(filterGroups(ALL, query({ sort: "created-desc" })))).toEqual([
      "Cabin",
      "Beach house",
      "Flat 12",
    ]);
    expect(names(filterGroups(ALL, query({ sort: "members-desc" })))).toEqual([
      "Beach house",
      "Flat 12",
      "Cabin",
    ]);
  });

  it("breaks a tie by name, so the order never shuffles", () => {
    const same = [
      { uid: "a", name: "Zinc", memberCount: 3 },
      { uid: "b", name: "Alder", memberCount: 3 },
    ];

    expect(names(filterGroups(same, query({ sort: "members-desc" })))).toEqual(["Alder", "Zinc"]);
  });

  it("sorts a group the backend sent no date for last", () => {
    const undated: MyGroup = { uid: "g5", name: "Undated" };

    expect(names(filterGroups([undated, FLAT], query({ sort: "joined-desc" })))).toEqual([
      "Flat 12",
      "Undated",
    ]);
  });

  it("leaves the list it was handed alone", () => {
    const given = [FLAT, HOUSE];
    filterGroups(given, query({ sort: "members-desc" }));

    expect(names(given)).toEqual(["Flat 12", "Beach house"]);
  });

  it("answers with nothing when nothing matches", () => {
    expect(filterGroups(ALL, query({ q: "garage" }))).toEqual([]);
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
