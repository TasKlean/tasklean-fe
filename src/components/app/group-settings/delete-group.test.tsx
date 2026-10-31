// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const deleteGroupAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({
    error: null,
  }),
);

vi.mock("@/app/(app)/app/groups/[uid]/settings/actions/actions", () => ({
  deleteGroupAction: (previous: unknown, data: FormData) => deleteGroupAction(previous, data),
}));

import { DeleteGroup } from "@/components/app/group-settings/delete-group";

const BASE = { groupUid: "g1", name: "Flat 4" };

beforeEach(() => {
  deleteGroupAction.mockClear();
  deleteGroupAction.mockImplementation(async () => ({ error: null }));
});

describe("DeleteGroup", () => {
  it("asks for the name before it offers the deletion", async () => {
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));

    expect(screen.getByLabelText('Type "Flat 4" to confirm')).toBeInTheDocument();
    expect(deleteGroupAction).not.toHaveBeenCalled();
  });

  it("keeps the deletion out of reach until the name matches", async () => {
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));
    const confirm = screen.getByRole("button", { name: "Delete this group" });

    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Type "Flat 4" to confirm'), "Flat");
    expect(confirm).toBeDisabled();
  });

  it("takes the name however it was capitalised or spaced", async () => {
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));
    await user.type(screen.getByLabelText('Type "Flat 4" to confirm'), "  flat 4 ");

    expect(screen.getByRole("button", { name: "Delete this group" })).toBeEnabled();
  });

  it("posts the group once the name is right", async () => {
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));
    await user.type(screen.getByLabelText('Type "Flat 4" to confirm'), "Flat 4");
    await user.click(screen.getByRole("button", { name: "Delete this group" }));

    expect(deleteGroupAction.mock.calls[0]?.[1].get("groupUid")).toBe("g1");
  });

  it("takes the question back, and forgets what was typed", async () => {
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));
    await user.type(screen.getByLabelText('Type "Flat 4" to confirm'), "Flat 4");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete group" }));

    expect(screen.getByLabelText('Type "Flat 4" to confirm')).toHaveValue("");
  });

  it("reports a refused deletion", async () => {
    deleteGroupAction.mockImplementation(async () => ({ error: "Only an admin can do that." }));
    const user = userEvent.setup();
    render(<DeleteGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Delete group" }));
    await user.type(screen.getByLabelText('Type "Flat 4" to confirm'), "Flat 4");
    await user.click(screen.getByRole("button", { name: "Delete this group" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an admin can do that.");
  });
});
