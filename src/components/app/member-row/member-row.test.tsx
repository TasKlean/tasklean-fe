// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const changeMemberRoleAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

const removeMemberAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/groups/[uid]/members/actions/actions", () => ({
  changeMemberRoleAction: (previous: unknown, data: FormData) =>
    changeMemberRoleAction(previous, data),
  removeMemberAction: (previous: unknown, data: FormData) => removeMemberAction(previous, data),
}));

import { MemberRow } from "@/components/app/member-row/member-row";

const BASE = {
  groupUid: "g1",
  memberUid: "m1",
  name: "Maja Bregar",
  firstName: "Maja",
  lastName: "Bregar",
  photoUrl: null,
  role: "Member",
  admin: false,
  joined: "Joined Mar 2026",
  you: false,
  manageable: true,
};

beforeEach(() => {
  changeMemberRoleAction.mockClear();
  changeMemberRoleAction.mockImplementation(async () => ({ error: null }));
  removeMemberAction.mockClear();
  removeMemberAction.mockImplementation(async () => ({ error: null }));
});

describe("MemberRow", () => {
  it("names the member and says where they stand", () => {
    render(<MemberRow {...BASE} />);

    expect(screen.getByText("Maja Bregar")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText("Joined Mar 2026")).toBeInTheDocument();
  });

  it("offers an admin the promotion of a member", async () => {
    const user = userEvent.setup();
    render(<MemberRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Make admin: Maja Bregar" }));

    const posted = changeMemberRoleAction.mock.calls[0]?.[1];
    expect(posted?.get("groupUid")).toBe("g1");
    expect(posted?.get("memberUid")).toBe("m1");
    expect(posted?.get("role")).toBe("GROUP_ADMIN");
  });

  it("offers the way back down for an admin", async () => {
    const user = userEvent.setup();
    render(<MemberRow {...BASE} role="Admin" admin />);

    await user.click(screen.getByRole("button", { name: "Make member: Maja Bregar" }));

    expect(changeMemberRoleAction.mock.calls[0]?.[1].get("role")).toBe("GROUP_MEMBER");
  });

  it("asks before it removes anyone", async () => {
    const user = userEvent.setup();
    render(<MemberRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Remove Maja Bregar" }));

    expect(screen.getByText("Remove Maja Bregar from this group?")).toBeInTheDocument();
    expect(removeMemberAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeMemberAction.mock.calls[0]?.[1].get("memberUid")).toBe("m1");
  });

  it("takes the question back", async () => {
    const user = userEvent.setup();
    render(<MemberRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Remove Maja Bregar" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Remove Maja Bregar" })).toBeInTheDocument();
  });

  it("marks your own row and leaves it alone", () => {
    render(<MemberRow {...BASE} you manageable={false} />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers a member no controls at all", () => {
    render(<MemberRow {...BASE} manageable={false} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers nothing on a membership that arrived without a uid", () => {
    render(<MemberRow {...BASE} memberUid={null} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("reports a refusal on the row it happened to", async () => {
    changeMemberRoleAction.mockImplementation(async () => ({
      error: "A group must have at least one admin. Make someone else an admin first.",
    }));
    const user = userEvent.setup();
    render(<MemberRow {...BASE} role="Admin" admin />);

    await user.click(screen.getByRole("button", { name: "Make member: Maja Bregar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A group must have at least one admin.",
    );
  });
});
