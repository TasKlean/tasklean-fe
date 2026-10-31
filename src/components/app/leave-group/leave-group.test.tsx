// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const leaveGroupAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
}));

vi.mock("@/app/(app)/app/groups/[uid]/overview/members/actions/actions", () => ({
  leaveGroupAction: (previous: unknown, data: FormData) => leaveGroupAction(previous, data),
}));

import { LeaveGroup } from "@/components/app/leave-group/leave-group";

const BASE = { groupUid: "g1", memberUid: "m1", admin: false };

beforeEach(() => {
  leaveGroupAction.mockClear();
  leaveGroupAction.mockImplementation(async () => ({ error: null }));
});

describe("LeaveGroup", () => {
  it("says what leaving costs", () => {
    render(<LeaveGroup {...BASE} />);

    expect(screen.getByRole("heading", { name: "Leave this group" })).toBeInTheDocument();
    expect(screen.getByText(/lose access to its tasks/)).toBeInTheDocument();
  });

  it("warns an admin about the guard before they press anything", () => {
    render(<LeaveGroup {...BASE} admin />);

    expect(screen.getByText(/keeps at least one admin/)).toBeInTheDocument();
  });

  it("says nothing about the guard to a member", () => {
    render(<LeaveGroup {...BASE} />);

    expect(screen.queryByText(/keeps at least one admin/)).toBeNull();
  });

  it("asks before it leaves", async () => {
    const user = userEvent.setup();
    render(<LeaveGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Leave group" }));

    expect(screen.getByText("Leave this group?")).toBeInTheDocument();
    expect(leaveGroupAction).not.toHaveBeenCalled();
  });

  it("posts the membership it was given", async () => {
    const user = userEvent.setup();
    render(<LeaveGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Leave group" }));
    await user.click(screen.getByRole("button", { name: "Leave group" }));

    const posted = leaveGroupAction.mock.calls[0]?.[1];
    expect(posted?.get("groupUid")).toBe("g1");
    expect(posted?.get("memberUid")).toBe("m1");
  });

  it("takes the question back", async () => {
    const user = userEvent.setup();
    render(<LeaveGroup {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Leave group" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Leave this group?")).toBeNull();
  });

  it("reports a refused leave and stays put", async () => {
    leaveGroupAction.mockImplementation(async () => ({
      error: "A group must have at least one admin. Make someone else an admin first.",
    }));
    const user = userEvent.setup();
    render(<LeaveGroup {...BASE} admin />);

    await user.click(screen.getByRole("button", { name: "Leave group" }));
    await user.click(screen.getByRole("button", { name: "Leave group" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Make someone else an admin first.");
  });
});
