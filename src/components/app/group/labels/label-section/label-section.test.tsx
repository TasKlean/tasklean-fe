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

import { LabelSection } from "@/components/app/group/labels/label-section/label-section";

function section(overrides: Partial<React.ComponentProps<typeof LabelSection>> = {}) {
  return (
    <LabelSection
      title="Categories"
      description="Manage your group's categories."
      note="You can add, rename and remove these."
      groupUid="g1"
      kind="category"
      canAdd
      {...overrides}
    >
      <p>the list</p>
    </LabelSection>
  );
}

describe("LabelSection", () => {
  it("shows a press rather than a form, so the list reads first", () => {
    render(section());

    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("draws no press for a reader who may not add one", () => {
    render(section({ canAdd: false }));

    expect(screen.queryByRole("button", { name: "Add category" })).toBeNull();
    expect(screen.getByText("the list")).toBeInTheDocument();
  });

  it("opens the fields above the list, so a long one is not scrolled past", async () => {
    render(section());

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));

    const field = screen.getByRole("textbox", { name: /Name/ });
    expect(field).toHaveValue("");
    expect(field.compareDocumentPosition(screen.getByText("the list"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("takes the press away while the form is open, so one label names one control", async () => {
    render(section());

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));

    expect(screen.getByRole("button", { name: "Add category" })).toHaveAttribute("type", "submit");
  });

  it("gives a tag no icon, which only a category carries", async () => {
    render(section({ kind: "tag", title: "Tags" }));

    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("combobox", { name: /Colour/ })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Icon/ })).toBeNull();
  });

  it("goes back to the press on cancel", async () => {
    render(section());

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Add category" })).toHaveAttribute("type", "button");
  });
});
