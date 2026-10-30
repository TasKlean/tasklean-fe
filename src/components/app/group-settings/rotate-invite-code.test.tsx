// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const rotateInviteCodeAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/groups/[uid]/settings/actions/actions", () => ({
  rotateInviteCodeAction: (previous: unknown, data: FormData) =>
    rotateInviteCodeAction(previous, data),
}));

import { RotateInviteCode } from "@/components/app/group-settings/rotate-invite-code";

beforeEach(() => {
  rotateInviteCodeAction.mockClear();
  rotateInviteCodeAction.mockImplementation(async () => ({ error: null }));
});

describe("RotateInviteCode", () => {
  it("asks before it replaces the code, and says who it costs", async () => {
    const user = userEvent.setup();
    render(<RotateInviteCode groupUid="g1" />);

    await user.click(screen.getByRole("button", { name: "New code" }));

    expect(screen.getByText(/already shared will stop working/)).toBeInTheDocument();
    expect(rotateInviteCodeAction).not.toHaveBeenCalled();
  });

  it("posts the group it was given", async () => {
    const user = userEvent.setup();
    render(<RotateInviteCode groupUid="g1" />);

    await user.click(screen.getByRole("button", { name: "New code" }));
    await user.click(screen.getByRole("button", { name: "Issue a new code" }));

    expect(rotateInviteCodeAction.mock.calls[0]?.[1].get("groupUid")).toBe("g1");
  });

  it("takes the question back", async () => {
    const user = userEvent.setup();
    render(<RotateInviteCode groupUid="g1" />);

    await user.click(screen.getByRole("button", { name: "New code" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("button", { name: "Issue a new code" })).toBeNull();
  });

  it("reports a refusal", async () => {
    rotateInviteCodeAction.mockImplementation(async () => ({
      error: "Only an admin can do that.",
    }));
    const user = userEvent.setup();
    render(<RotateInviteCode groupUid="g1" />);

    await user.click(screen.getByRole("button", { name: "New code" }));
    await user.click(screen.getByRole("button", { name: "Issue a new code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an admin can do that.");
  });
});
