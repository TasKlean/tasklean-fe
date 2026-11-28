// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TypeMenu } from "@/components/app/group/overview/activity/type-menu/type-menu";
import type { EntityChoice, MemberChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

const MEMBERS: MemberChoice[] = [
  { ref: "m1", name: "Alice Johnson", former: false },
  { ref: "m2", name: "Dan Novak", former: false },
];

const TASKS: EntityChoice[] = [
  { ref: "t1", name: "Bins" },
  { ref: "t2", name: "Hoover" },
];

const CATEGORIES: EntityChoice[] = [{ ref: "3", name: "Kitchen" }];

const TAGS: EntityChoice[] = [{ ref: "4", name: "weekly" }];

type MenuRows = {
  members?: MemberChoice[];
  tasks?: EntityChoice[];
  categories?: EntityChoice[];
  tags?: EntityChoice[];
  onSearchTasks?: (query: string) => Promise<EntityChoice[] | null>;
};

function renderMenu(
  filter: Partial<AuditFilter> = {},
  rows: MenuRows = {},
  pinned: string | null = null,
) {
  render(
    <TypeMenu
      path={PATH}
      filter={{ type: null, ref: "", actor: "", from: "", to: "", ...filter }}
      members={rows.members ?? MEMBERS}
      tasks={rows.tasks ?? TASKS}
      categories={rows.categories ?? CATEGORIES}
      tags={rows.tags ?? TAGS}
      onSearchTasks={rows.onSearchTasks ?? (async () => [])}
      pinned={pinned}
    />,
  );
}

async function open(): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button", { name: /Filter activity/ }));
}

async function press(name: string): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button", { name }));
}

describe("TypeMenu", () => {
  it("carries the kind the trail is narrowed to, not the word filter", () => {
    renderMenu({ type: "task", ref: "" });

    expect(screen.getByRole("button", { name: "Filter activity, showing Tasks" })).toBeVisible();
  });

  it("names the one thing the feed is pinned to, since nothing else says which", () => {
    renderMenu({ type: "member", ref: "m2" }, {}, "Dan Novak");

    expect(screen.getByRole("button", { name: /Member: Dan Novak/ })).toHaveTextContent(
      "Member: Dan Novak",
    );
  });

  it("names the kind alone for a pinned thing nothing could name", () => {
    renderMenu({ type: "member", ref: "m9" }, {}, null);

    expect(screen.getByRole("button")).toHaveTextContent("One member");
  });

  it("reads as the whole trail, and goes back to it, when nothing narrows it", async () => {
    renderMenu({ type: null, ref: "" });
    expect(screen.getByRole("button", { name: /All activity/ })).toBeVisible();

    await open();
    const all = screen.getByRole("link", { name: "All activity" });

    expect(all).toHaveAttribute("href", PATH);
    expect(all).toHaveAttribute("aria-current", "page");
  });

  it("drops a ref alongside the kind it offers, since a kind is the wider ask", async () => {
    renderMenu({ type: "member", ref: "m2" });

    await open();
    await press("Back to activity kinds");

    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "href",
      `${PATH}?type=member`,
    );
  });

  it("marks only the kind that is on", async () => {
    renderMenu({ type: "tag", ref: "" });

    await open();

    expect(screen.getByRole("link", { name: "Tags" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Tasks" })).not.toHaveAttribute("aria-current");
  });

  it("pins the feed to one member, behind the press beside the members row", async () => {
    renderMenu({ type: null, ref: "" });

    await open();
    await press("Choose one member");

    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute(
      "href",
      `${PATH}?type=member&ref=m2`,
    );
    expect(screen.getByRole("link", { name: "All members" })).toHaveAttribute(
      "href",
      `${PATH}?type=member`,
    );
  });

  it("comes back to the kinds from the member list", async () => {
    renderMenu({ type: null, ref: "" });

    await open();
    await press("Choose one member");
    await press("Back to activity kinds");

    expect(screen.getByRole("link", { name: "Categories" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Dan Novak" })).toBeNull();
  });

  it("sends focus after the panel it swapped, so a keyboard does not land on the document", async () => {
    renderMenu({ type: null, ref: "" });

    await open();
    await press("Choose one member");
    expect(screen.getByRole("button", { name: "Back to activity kinds" })).toHaveFocus();

    await press("Back to activity kinds");
    expect(screen.getByRole("button", { name: "Choose one member" })).toHaveFocus();
  });

  it("leaves focus on the trigger when the panel merely opens", async () => {
    renderMenu({ type: null, ref: "" });

    await open();

    expect(screen.getByRole("button", { name: /All activity/ })).toHaveFocus();
  });

  it("carries whose actions are being read into every kind it offers", async () => {
    renderMenu({ actor: "u2" });

    await open();

    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
      "href",
      `${PATH}?type=task&actor=u2`,
    );
    expect(screen.getByRole("link", { name: "All activity" })).toHaveAttribute(
      "href",
      `${PATH}?actor=u2`,
    );
  });

  it("offers no member list at all when the roster would not load", async () => {
    renderMenu({ type: null, ref: "" }, { members: [] });

    await open();

    expect(screen.getByRole("link", { name: "Members" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Choose one member" })).toBeNull();
  });

  it("pins the feed to one task, one category and one tag", async () => {
    renderMenu({ type: null, ref: "" });

    await open();
    await press("Choose one task");
    expect(screen.getByRole("link", { name: "Bins" })).toHaveAttribute(
      "href",
      `${PATH}?type=task&ref=t1`,
    );

    await press("Back to activity kinds");
    await press("Choose one category");
    expect(screen.getByRole("link", { name: "Kitchen" })).toHaveAttribute(
      "href",
      `${PATH}?type=category&ref=3`,
    );

    await press("Back to activity kinds");
    await press("Choose one tag");
    expect(screen.getByRole("link", { name: "weekly" })).toHaveAttribute(
      "href",
      `${PATH}?type=tag&ref=4`,
    );
  });

  it("offers no list for a kind with nothing in it", async () => {
    renderMenu({ type: null, ref: "" }, { categories: [], tags: [] });

    await open();

    expect(screen.getByRole("link", { name: "Categories" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Choose one category" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Choose one tag" })).toBeNull();
  });

  it("searches the tasks beyond the few it offers, and lists what came back", async () => {
    const user = userEvent.setup({ delay: null });
    const onSearchTasks = vi.fn(async () => [{ ref: "t9", name: "Windows" }]);

    renderMenu({ type: null, ref: "" }, { onSearchTasks });
    await open();
    await press("Choose one task");
    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "win");

    await waitFor(() => expect(onSearchTasks).toHaveBeenCalledWith("win"));
    await waitFor(() => expect(screen.getByRole("link", { name: "Windows" })).toBeVisible());

    expect(screen.queryByRole("link", { name: "Bins" })).toBeNull();
    expect(screen.getByRole("link", { name: "All tasks" })).toBeVisible();
  });

  it("asks nothing of the server while the box is empty", async () => {
    const onSearchTasks = vi.fn(async () => []);

    renderMenu({ type: null, ref: "" }, { onSearchTasks });
    await open();
    await press("Choose one task");

    expect(onSearchTasks).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Bins" })).toBeVisible();
  });

  it("says a search that could not be made was not made, rather than showing nothing", async () => {
    const user = userEvent.setup({ delay: null });

    renderMenu({ type: null, ref: "" }, { onSearchTasks: async () => null });
    await open();
    await press("Choose one task");
    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "win");

    await waitFor(() => expect(screen.getByText(/could not search/)).toBeVisible());
    expect(screen.queryByText("Nothing matches that.")).toBeNull();
  });

  it("says nothing matched when the search came back empty", async () => {
    const user = userEvent.setup({ delay: null });

    renderMenu({ type: null, ref: "" }, { onSearchTasks: async () => [] });
    await open();
    await press("Choose one task");
    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "win");

    await waitFor(() => expect(screen.getByText("Nothing matches that.")).toBeVisible());
  });

  it("offers a search box on the tasks alone", async () => {
    renderMenu({ type: null, ref: "" });

    await open();
    await press("Choose one member");

    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("opens on the list the feed is already pinned inside", async () => {
    renderMenu({ type: "task", ref: "t2" });

    await open();

    expect(screen.getByRole("link", { name: "Hoover" })).toHaveAttribute("aria-current", "page");
  });

  it("opens on the member list when the feed is already pinned to one", async () => {
    renderMenu({ type: "member", ref: "m2" });

    await open();

    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Alice Johnson" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "All members" })).not.toHaveAttribute("aria-current");
  });
});
