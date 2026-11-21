// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; saved: boolean };

const updateTagAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
  saved: true,
}));

vi.mock("@/app/(app)/app/groups/[uid]/labels/actions/actions", () => ({
  updateTagAction: (previous: unknown, data: FormData) => updateTagAction(previous, data),
  createTagAction: async () => ({ error: null, saved: true }),
}));

import { TagForm } from "@/components/app/group/labels/tag-form/tag-form";

const TAG = { id: 3, name: "Urgent", color: "#e8505b" };

beforeEach(() => {
  updateTagAction.mockClear();
  updateTagAction.mockImplementation(async () => ({ error: null, saved: true }));
});

describe("TagForm", () => {
  it("offers a member no name field, since only an admin may move one", () => {
    render(<TagForm groupUid="g1" tag={TAG} canRename={false} />);

    expect(screen.queryByRole("textbox", { name: /Name/ })).toBeNull();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("posts a member's save with the name exactly as stored, which is what the backend compares", async () => {
    render(<TagForm groupUid="g1" tag={TAG} canRename={false} />);

    await userEvent.click(screen.getByRole("combobox", { name: /Colour/ }));
    await userEvent.click(screen.getByRole("option", { name: "Teal" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const sent = updateTagAction.mock.calls[0]?.[1];
    expect(sent?.get("name")).toBe("Urgent");
    expect(sent?.get("color")).toBe("#43aa8b");
    expect(sent?.get("id")).toBe("3");
  });

  it("lets an admin rename, and sends what they typed", async () => {
    render(<TagForm groupUid="g1" tag={TAG} canRename />);

    const field = screen.getByRole("textbox", { name: /Name/ });
    await userEvent.clear(field);
    await userEvent.type(field, "Urgent jobs");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateTagAction.mock.calls[0]?.[1].get("name")).toBe("Urgent jobs");
  });

  it("closes the editor once the save lands, and not before", async () => {
    const onSaved = vi.fn();
    updateTagAction.mockImplementation(async () => ({ error: null, saved: false }));
    render(<TagForm groupUid="g1" tag={TAG} canRename onSaved={onSaved} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSaved).not.toHaveBeenCalled();
  });
});
