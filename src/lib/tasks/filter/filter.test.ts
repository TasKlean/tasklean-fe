import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  boardHref,
  carriedFields,
  editTaskHref,
  openTaskHref,
  DEFAULT_STATES,
  narrowsBoard,
  taskApiQuery,
  taskQuery,
  taskQueryParams,
} from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

const MINE = "member-1";

function query(overrides: Partial<TaskQuery> = {}): TaskQuery {
  return {
    q: "",
    status: DEFAULT_STATES,
    who: { kind: "anyone" },
    categoryId: null,
    tagId: null,
    priority: [],
    overdue: false,
    sort: "due-asc",
    page: 1,
    ...overrides,
  };
}

describe("taskQuery", () => {
  it("opens on the chores still waiting, which is what no status means", () => {
    expect(taskQuery({}).status).toEqual(["open"]);
  });

  it("keeps the states it knows and drops the rest", () => {
    expect(taskQuery({ status: ["done", "nonsense", "archived"] }).status).toEqual([
      "done",
      "archived",
    ]);
  });

  it("falls back to the default when every state asked for is unknown", () => {
    expect(taskQuery({ status: ["nonsense"] }).status).toEqual(["open"]);
  });

  it.each([
    ["me", { kind: "me" }],
    ["free", { kind: "free" }],
    ["member-9", { kind: "member", memberUid: "member-9" }],
    ["", { kind: "anyone" }],
  ])("reads who=%j", (value, expected) => {
    expect(taskQuery({ who: value }).who).toEqual(expected);
  });

  it.each(["0", "-2", "1.5", "abc", ""])("treats page %j as the first page", (value) => {
    expect(taskQuery({ page: value }).page).toBe(1);
  });

  it.each(["0", "-3", "abc", "1.5", ""])("treats a category id of %j as none", (value) => {
    expect(taskQuery({ category: value }).categoryId).toBeNull();
  });

  it("caps a pasted search at the length the backend refuses past", () => {
    expect(taskQuery({ q: "a".repeat(200) }).q).toHaveLength(100);
  });

  it("falls back to due soonest for a sort it does not know", () => {
    expect(taskQuery({ sort: "cheapest" }).sort).toBe("due-asc");
  });
});

describe("taskQueryParams", () => {
  it("writes nothing at all for an untouched board", () => {
    expect(taskQueryParams(query()).toString()).toBe("");
  });

  it("writes no status for the default, which the endpoint assumes anyway", () => {
    expect(taskQueryParams(query({ status: ["open"] })).toString()).toBe("");
  });

  it("round-trips every axis it writes, keeping one value per repeated key", () => {
    const original = query({
      q: "floor",
      status: ["done", "archived"],
      who: { kind: "member", memberUid: "member-9" },
      categoryId: 3,
      tagId: 7,
      priority: ["high", "low"],
      overdue: true,
      sort: "name",
      page: 4,
    });

    const params = taskQueryParams(original);

    expect(taskQuery(Object.fromEntries(params.entries()) as Record<string, string>)).toEqual({
      ...original,
      status: ["archived"],
      priority: ["low"],
    });
  });

  it("repeats a key per state and per priority", () => {
    const params = taskQueryParams(query({ status: ["open", "done"], priority: ["high", "low"] }));

    expect(params.getAll("status")).toEqual(["open", "done"]);
    expect(params.getAll("priority")).toEqual(["high", "low"]);
  });
});

describe("taskApiQuery", () => {
  it("never sends assignedToUid and unassigned together, which is a 400", () => {
    for (const who of [{ kind: "me" }, { kind: "free" }, { kind: "member", memberUid: "m" }]) {
      const params = taskApiQuery(query({ who: who as TaskQuery["who"] }), MINE);

      expect("assignedToUid" in params && "unassigned" in params).toBe(false);
    }
  });

  it("asks for the pool by the flag, never by a uid", () => {
    expect(taskApiQuery(query({ who: { kind: "free" } }), MINE)).toEqual({ unassigned: true });
  });

  it("resolves who=me to the reader's own membership", () => {
    expect(taskApiQuery(query({ who: { kind: "me" } }), MINE)).toEqual({ assignedToUid: MINE });
  });

  it("drops who=me rather than guessing when the membership is unknown", () => {
    expect(taskApiQuery(query({ who: { kind: "me" } }), null)).toEqual({});
  });

  it("sends no status for the default, so the endpoint applies its own", () => {
    expect(taskApiQuery(query(), MINE)).toEqual({});
  });

  it("expands a state into every status it stands for", () => {
    expect(taskApiQuery(query({ status: ["open", "done"] }), MINE).status).toEqual([
      "TODO",
      "IN_PROGRESS",
      "COMPLETED",
    ]);
  });

  it("counts pages from zero on the wire where a reader counts from one", () => {
    expect(taskApiQuery(query({ page: 3 }), MINE).page).toBe(2);
  });

  it("sends no page for the first one", () => {
    expect(taskApiQuery(query({ page: 1 }), MINE)).toEqual({});
  });

  it("maps our tokens to the endpoint's enums", () => {
    const params = taskApiQuery(query({ priority: ["high"], sort: "priority" }), MINE);

    expect(params).toMatchObject({ priority: ["HIGH"], sort: "PRIORITY_HIGH_FIRST" });
  });
});

describe("narrowsBoard", () => {
  it.each([
    ["a search", { q: "floor" }],
    ["a status other than the default", { status: ["archived" as const] }],
    ["an assignee", { who: { kind: "me" as const } }],
    ["a category", { categoryId: 3 }],
    ["a tag", { tagId: 7 }],
    ["a priority", { priority: ["high" as const] }],
    ["the overdue flag", { overdue: true }],
  ])("counts %s", (_label, overrides) => {
    expect(narrowsBoard(query(overrides))).toBe(true);
  });

  it.each([
    ["a sort", { sort: "name" as const }],
    ["a page", { page: 3 }],
  ])("does not count %s, which hides no chore", (_label, overrides) => {
    expect(narrowsBoard(query(overrides))).toBe(false);
  });
});

describe("boardHref", () => {
  const PATH = "/app/groups/g1";

  it("returns the bare path when the change leaves nothing to carry", () => {
    expect(boardHref(PATH, query({ sort: "name" }), { sort: "due-asc" })).toBe(PATH);
  });

  it("sends a narrowed board back to the first page", () => {
    expect(boardHref(PATH, query({ page: 4 }), { overdue: true })).toBe(`${PATH}?overdue=1`);
  });

  it("keeps the page when the page is what changed", () => {
    expect(boardHref(PATH, query({ overdue: true }), { page: 3 })).toBe(`${PATH}?overdue=1&page=3`);
  });

  it("keeps the axes it was not asked to change", () => {
    const href = boardHref(PATH, query({ q: "floor", sort: "name" }), { overdue: true });

    expect(href).toBe(`${PATH}?q=floor&overdue=1&sort=name`);
  });
});

describe("carriedFields", () => {
  it("carries every axis but the search and the page", () => {
    const fields = carriedFields(
      query({ q: "floor", page: 3, overdue: true, sort: "name", tagId: 7 }),
    );

    expect(fields).toEqual([
      { name: "tag", value: "7" },
      { name: "overdue", value: "1" },
      { name: "sort", value: "name" },
    ]);
  });

  it("carries one field per value of a repeated axis", () => {
    const fields = carriedFields(query({ priority: ["high", "low"] }));

    expect(fields).toEqual([
      { name: "priority", value: "high" },
      { name: "priority", value: "low" },
    ]);
  });
});

describe("openTaskHref", () => {
  const PATH = "/app/groups/g1";

  it("opens a chore over an untouched board", () => {
    expect(openTaskHref(PATH, query(), "t1")).toBe(`${PATH}?task=t1`);
  });

  it("keeps the filter and the page, so closing it returns to the same board", () => {
    expect(openTaskHref(PATH, query({ overdue: true, page: 2 }), "t1")).toBe(
      `${PATH}?overdue=1&page=2&task=t1`,
    );
  });
});

describe("editTaskHref", () => {
  const PATH = "/app/groups/g1";

  it("opens a chore on its editor, which a row cannot ask for any other way", () => {
    expect(editTaskHref(PATH, query(), "t1")).toBe(`${PATH}?task=t1&edit=1`);
  });

  it("keeps the filter, so discarding returns to the same board", () => {
    expect(editTaskHref(PATH, query({ overdue: true, page: 2 }), "t1")).toBe(
      `${PATH}?overdue=1&page=2&task=t1&edit=1`,
    );
  });
});

describe("activeFilterCount", () => {
  it("counts nothing on an untouched board", () => {
    expect(activeFilterCount(query())).toBe(0);
  });

  it("leaves the search out, which has its own box on the bar", () => {
    expect(activeFilterCount(query({ q: "floor" }))).toBe(0);
  });

  it("counts a sort, which the panel also holds", () => {
    expect(activeFilterCount(query({ sort: "name" }))).toBe(1);
  });

  it("counts one per axis, not one per value", () => {
    expect(activeFilterCount(query({ priority: ["high", "low"], overdue: true }))).toBe(2);
  });

  it("does not count the default status", () => {
    expect(activeFilterCount(query({ status: ["open"] }))).toBe(0);
  });
});
