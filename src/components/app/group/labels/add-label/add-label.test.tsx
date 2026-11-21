// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/labels/actions/actions", () => ({
  createCategoryAction: async () => ({ error: null, saved: true }),
  updateCategoryAction: async () => ({ error: null, saved: true }),
  createTagAction: async () => ({ error: null, saved: true }),
  updateTagAction: async () => ({ error: null, saved: true }),
}));

import { AddLabel } from "@/components/app/group/labels/add-label/add-label";

describe("AddLabel", () => {
  it("shows a press rather than a form, so the list reads first", () => {
    render(<AddLabel groupUid="g1" kind="category" />);

    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("swaps itself for the fields, so the label now belongs to the form's own submit", async () => {
    render(<AddLabel groupUid="g1" kind="tag" />);

    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add tag" })).toHaveAttribute("type", "submit");
  });

  it("gives a tag no icon, which only a category carries", async () => {
    render(<AddLabel groupUid="g1" kind="tag" />);

    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("combobox", { name: /Colour/ })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Icon/ })).toBeNull();
  });

  it("goes back to the press on cancel", async () => {
    render(<AddLabel groupUid="g1" kind="category" />);

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
  });
});
