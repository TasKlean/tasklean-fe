// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  setBoardViewAction: vi.fn(),
}));

import { ViewPills } from "@/components/app/group/board/view-pills/view-pills";

describe("ViewPills", () => {
  it("marks the layout the board is drawn in", () => {
    render(<ViewPills view="cards" />);

    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "false");
  });

  it("carries the layout on the button itself, so nothing is held in state", () => {
    render(<ViewPills view="list" />);

    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("value", "cards");
    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("name", "view");
  });

  it("submits, so the press works with no JavaScript", () => {
    render(<ViewPills view="list" />);

    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("type", "submit");
  });
});
