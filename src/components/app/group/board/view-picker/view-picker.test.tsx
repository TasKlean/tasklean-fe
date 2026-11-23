// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  setBoardViewAction: vi.fn(),
}));

import { ViewPicker } from "@/components/app/group/board/view-picker/view-picker";

describe("ViewPicker", () => {
  it("marks the layout the board is drawn in", () => {
    render(<ViewPicker view="cards" />);

    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "false");
  });

  it("names the layout that is drawn as an icon alone", () => {
    render(<ViewPicker view="cards" />);

    expect(screen.getByRole("button", { name: "List" })).toBeVisible();
  });

  it("carries the layout on the button, which submits with no JavaScript", () => {
    render(<ViewPicker view="list" />);
    const cards = screen.getByRole("button", { name: "Cards" });

    expect(cards).toHaveAttribute("type", "submit");
    expect(cards).toHaveAttribute("name", "view");
    expect(cards).toHaveAttribute("value", "cards");
  });
});
