// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { FilterPanel } from "@/components/app/group/board/filter-panel/filter-panel";
import { DEFAULT_STATES } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

const PATH = "/app/groups/g1";

const MEMBERS = [
  { memberUid: "m1", name: "Maja Novak", former: false, self: true },
  { memberUid: "m2", name: "Dan Kos", former: true, self: false },
];

const CATEGORIES = [{ id: 3, name: "Kitchen", color: "#43aa8b" }];
const TAGS = [{ id: 7, name: "weekly", color: "#4d96ff" }];

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

async function open(overrides: Partial<TaskQuery> = {}) {
  const result = render(
    <FilterPanel
      path={PATH}
      query={query(overrides)}
      members={MEMBERS}
      categories={CATEGORIES}
      tags={TAGS}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /Filter and sort/ }));
  return result;
}

afterEach(() => {
  push.mockClear();
});

describe("FilterPanel", () => {
  it("keeps the panel shut until it is pressed", () => {
    render(<FilterPanel path={PATH} query={query()} members={[]} categories={[]} tags={[]} />);

    expect(screen.queryByRole("group", { name: "Status" })).toBeNull();
  });

  it("starts a field collapsed, so six axes are not six open lists", async () => {
    await open();

    for (const name of ["Assigned to", "Category", "Tag", "Priority", "Status", "Due"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("starts the field the board is narrowed by open, so what is applied is in view", async () => {
    await open({ categoryId: 3 });

    expect(screen.getByRole("button", { name: "Category" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tag" })).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a field on the press and names what it controls", async () => {
    await open();
    const toggle = screen.getByRole("button", { name: "Priority" });

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls") ?? "")).toContainElement(
      screen.getByRole("checkbox", { name: "High" }),
    );
  });

  it("keeps a collapsed field's choice, where unmounting it would clear the filter", async () => {
    await open({ categoryId: 3 });
    await userEvent.click(screen.getByRole("button", { name: "Category" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(`${PATH}?category=3`);
  });

  it("leaves out the axes nothing was picked on, which a native GET would post empty", async () => {
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: "High" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(`${PATH}?priority=high`);
  });

  it("applies the picked axes together, in the URL the board reads", async () => {
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: "Completed" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Overdue only" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(`${PATH}?status=open&status=done&overdue=1`);
  });

  it("sends the reader back to the first page, which a shorter result may not have", async () => {
    await open({ page: 4 });
    await userEvent.click(screen.getByRole("checkbox", { name: "Low" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(`${PATH}?priority=low`);
  });

  it("keeps the search, which has its own box on the bar", async () => {
    await open({ q: "floor" });
    await userEvent.click(screen.getByRole("checkbox", { name: "High" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(`${PATH}?q=floor&priority=high`);
  });

  it("posts to the board as a GET, so the filter works with no JavaScript", async () => {
    const { container } = await open();
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("action", PATH);
    expect(form).toHaveAttribute("method", "get");
  });

  it("applies every axis in one press rather than one navigation per choice", async () => {
    await open();

    expect(screen.getAllByRole("button", { name: "Apply" })).toHaveLength(1);
  });

  it("never posts the page, so a new filter starts at the first one", async () => {
    const { container } = await open({ page: 4 });

    expect(container.querySelector("[name=page]")).toBeNull();
  });

  it("carries the search, which has its own box on the bar", async () => {
    const { container } = await open({ q: "floor" });

    expect(container.querySelector("input[name=q]")).toHaveAttribute("value", "floor");
  });

  it("counts the axes it is holding back, leaving the search out", async () => {
    render(
      <FilterPanel
        path={PATH}
        query={query({ q: "floor", overdue: true, sort: "name" })}
        members={[]}
        categories={[]}
        tags={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "Filter and sort, 2 applied" })).toBeVisible();
  });

  it("ticks the states the board is already showing", async () => {
    await open({ status: ["open", "archived"] });

    expect(screen.getByRole("checkbox", { name: "To-Do" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Archived" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Completed" })).not.toBeChecked();
  });

  it("takes one answer for who, so the two the endpoint refuses together cannot both be sent", async () => {
    const { container } = await open({ who: { kind: "free" } });

    expect(container.querySelectorAll("input[name=who]")).toHaveLength(1);
    expect(container.querySelector("input[name=who]")).toHaveAttribute("value", "free");
  });

  it("names the member a board is narrowed to on the closed dropdown", async () => {
    await open({ who: { kind: "member", memberUid: "m2" } });

    expect(screen.getByRole("combobox", { name: "Show chores assigned to" })).toHaveTextContent(
      "Dan Kos",
    );
  });

  it("offers the reader one row, not a second under their own name", async () => {
    await open();
    await userEvent.click(screen.getByRole("combobox", { name: "Show chores assigned to" }));

    expect(screen.getByRole("option", { name: "Me (Maja Novak)" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Maja Novak" })).toBeNull();
  });

  it("reads the reader's own membership as that one row, since a URL may name either", async () => {
    await open({ who: { kind: "member", memberUid: "m1" } });

    expect(screen.getByRole("combobox", { name: "Show chores assigned to" })).toHaveTextContent(
      "Me (Maja Novak)",
    );
  });

  it("puts the two answers naming nobody above the rule, and the people below", async () => {
    await open();
    await userEvent.click(screen.getByRole("combobox", { name: "Show chores assigned to" }));

    const rows = screen.getAllByRole("option").map((row) => row.textContent);
    expect(rows).toEqual(["Anyone", "Unassigned", "Me (Maja Novak)", "Dan Kos (left)"]);
  });

  it("marks a member who has left, since a dropdown row has no divider to sit under", async () => {
    await open();
    await userEvent.click(screen.getByRole("combobox", { name: "Show chores assigned to" }));

    expect(screen.getByRole("option", { name: /Dan Kos \(left\)/ })).toBeVisible();
  });

  it("opens and closes every field from the one press in the heading", async () => {
    await open();
    const names = ["Assigned to", "Category", "Tag", "Priority", "Status", "Due"];

    await userEvent.click(screen.getByRole("button", { name: "Expand all" }));

    for (const name of names) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "true");
    }

    await userEvent.click(screen.getByRole("button", { name: "Close all" }));

    for (const name of names) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("puts the order in a dropdown rather than five more pills", async () => {
    const { container } = await open({ sort: "name" });

    expect(screen.getByRole("combobox", { name: "Sort the board by" })).toHaveTextContent(
      "Name A to Z",
    );
    expect(container.querySelector("input[name=sort]")).toHaveAttribute("value", "name");
  });

  it("keeps overdue out of priority, which is the three levels alone", async () => {
    const { container } = await open();

    expect(container.querySelectorAll("input[name=priority]")).toHaveLength(3);
    expect(screen.getByRole("checkbox", { name: "Overdue only" })).toHaveAttribute(
      "name",
      "overdue",
    );
  });

  it("offers no way to clear filters when none are on", async () => {
    await open();

    expect(screen.queryByRole("link", { name: "Clear filters" })).toBeNull();
  });

  it("clears the filters without clearing the search", async () => {
    await open({ q: "floor", overdue: true });

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      `${PATH}?q=floor`,
    );
  });
});
