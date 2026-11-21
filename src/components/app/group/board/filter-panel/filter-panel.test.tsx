// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FilterPanel } from "@/components/app/group/board/filter-panel/filter-panel";
import { DEFAULT_STATES } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

const PATH = "/app/groups/g1";

const MEMBERS = [
  { memberUid: "m1", name: "Maja Novak", former: false },
  { memberUid: "m2", name: "Dan Kos", former: true },
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

describe("FilterPanel", () => {
  it("keeps the panel shut until it is pressed", () => {
    render(<FilterPanel path={PATH} query={query()} members={[]} categories={[]} tags={[]} />);

    expect(screen.queryByRole("group", { name: "Status" })).toBeNull();
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
    await open({ who: { kind: "member", memberUid: "m1" } });

    expect(screen.getByRole("combobox", { name: "Show chores assigned to" })).toHaveTextContent(
      "Maja Novak",
    );
  });

  it("marks a member who has left, since a dropdown row has no divider to sit under", async () => {
    await open();
    await userEvent.click(screen.getByRole("combobox", { name: "Show chores assigned to" }));

    expect(screen.getByRole("option", { name: /Dan Kos \(left\)/ })).toBeVisible();
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
