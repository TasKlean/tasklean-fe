// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  setBoardViewAction: vi.fn(),
}));

import { ViewMenu } from "@/components/app/group/board/view-menu/view-menu";

describe("ViewMenu", () => {
  it("names the layout the board is drawn in", () => {
    render(<ViewMenu view="cards" />);

    expect(screen.getByRole("button", { name: "Layout, showing cards" })).toBeVisible();
  });

  it("keeps the list shut until it is pressed", () => {
    render(<ViewMenu view="list" />);

    expect(screen.queryByRole("button", { name: /^Cards/ })).toBeNull();
  });

  it("offers both layouts, each submitting its own value", async () => {
    render(<ViewMenu view="list" />);
    await userEvent.click(screen.getByRole("button", { name: /^Layout/ }));

    const cards = screen.getByRole("button", { name: "Cards" });

    expect(cards).toHaveAttribute("type", "submit");
    expect(cards).toHaveAttribute("name", "view");
    expect(cards).toHaveAttribute("value", "cards");
  });
});
