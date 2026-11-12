// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypeMenu } from "@/components/app/group/overview/activity/type-menu/type-menu";
import type { MemberChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

const MEMBERS: MemberChoice[] = [
  { ref: "m1", name: "Alice Johnson", former: false },
  { ref: "m2", name: "Dan Novak", former: false },
];

function renderMenu(
  filter: Partial<AuditFilter> = {},
  members: MemberChoice[] = MEMBERS,
  pinned: string | null = null,
) {
  render(
    <TypeMenu
      path={PATH}
      filter={{ type: null, ref: "", actor: "", from: "", to: "", ...filter }}
      members={members}
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
    renderMenu({ type: "member", ref: "m2" }, MEMBERS, "Dan Novak");

    expect(screen.getByRole("button", { name: /Member: Dan Novak/ })).toHaveTextContent(
      "Member: Dan Novak",
    );
  });

  it("names the kind alone for a pinned thing nothing could name", () => {
    renderMenu({ type: "member", ref: "m9" }, MEMBERS, null);

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
    renderMenu({ type: null, ref: "" }, []);

    await open();

    expect(screen.getByRole("link", { name: "Members" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Choose one member" })).toBeNull();
  });

  it("opens on the member list when the feed is already pinned to one", async () => {
    renderMenu({ type: "member", ref: "m2" });

    await open();

    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Alice Johnson" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "All members" })).not.toHaveAttribute("aria-current");
  });
});
