// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypeMenu } from "@/components/app/group/overview/activity/type-menu/type-menu";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

function renderMenu(filter: AuditFilter) {
  render(<TypeMenu path={PATH} filter={filter} />);
}

async function open(): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button"));
}

describe("TypeMenu", () => {
  it("carries the kind the trail is narrowed to, not the word filter", () => {
    renderMenu({ type: "task", ref: "" });

    expect(screen.getByRole("button", { name: "Filter activity, showing Tasks" })).toBeVisible();
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
});
