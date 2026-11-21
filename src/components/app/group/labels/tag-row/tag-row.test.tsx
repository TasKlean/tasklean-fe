// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const deleteTagAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
}));

vi.mock("@/app/(app)/app/groups/[uid]/labels/actions/actions", () => ({
  deleteTagAction: (previous: unknown, data: FormData) => deleteTagAction(previous, data),
  updateTagAction: async () => ({ error: null, saved: true }),
  createTagAction: async () => ({ error: null, saved: true }),
}));

import { TagRow } from "@/components/app/group/labels/tag-row/tag-row";

const TAG = { id: 3, name: "Urgent", color: "#e8505b" };

beforeEach(() => {
  deleteTagAction.mockClear();
  deleteTagAction.mockImplementation(async () => ({ error: null }));
});

describe("TagRow", () => {
  it("lets a member recolour a tag but never remove one", () => {
    render(<TagRow groupUid="g1" tag={TAG} admin={false} />);

    expect(screen.getByRole("button", { name: "Change the colour of Urgent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Urgent" })).toBeNull();
  });

  it("gives an admin the whole editor and the removal", () => {
    render(<TagRow groupUid="g1" tag={TAG} admin />);

    expect(screen.getByRole("button", { name: "Edit Urgent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Urgent" })).toBeInTheDocument();
  });

  it("says a delete takes the label off every task carrying it", async () => {
    render(<TagRow groupUid="g1" tag={TAG} admin />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Urgent" }));

    expect(deleteTagAction).not.toHaveBeenCalled();
    expect(screen.getByText(/comes off every task carrying it/)).toBeInTheDocument();
  });
});
