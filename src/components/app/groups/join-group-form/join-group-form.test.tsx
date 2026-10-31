// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  fieldErrors?: { inviteCode?: string };
  alreadyMember?: boolean;
  inviteCode?: string;
};

const joinGroupAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
}));

vi.mock("@/app/(app)/app/groups/join/actions/actions", () => ({
  joinGroupAction: (previous: unknown, data: FormData) => joinGroupAction(previous, data),
}));

import { JoinGroupForm } from "@/components/app/groups/join-group-form/join-group-form";

beforeEach(() => {
  joinGroupAction.mockClear();
  joinGroupAction.mockImplementation(async () => ({ error: null }));
});

describe("JoinGroupForm", () => {
  it("does not spend a join attempt on something that cannot be a code", async () => {
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "A1B2");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(joinGroupAction).not.toHaveBeenCalled();
    expect(screen.getByText("An invite code is 8 letters and numbers.")).toBeInTheDocument();
  });

  it("sends a code typed in lower case, because the backend upper-cases its own", async () => {
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(joinGroupAction).toHaveBeenCalledTimes(1);
    expect(joinGroupAction.mock.calls[0][1].get("inviteCode")).toBe("a1b2c3d4");
  });

  it("takes a code pasted with a hyphen in it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2-c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(joinGroupAction).toHaveBeenCalledTimes(1);
  });

  it("says nothing about an empty field until the press", async () => {
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.click(screen.getByLabelText("Invite code"));
    await user.tab();

    expect(screen.queryByText("Enter an invite code.")).not.toBeInTheDocument();
  });

  it("shows a refused code against the field, never saying which kind it was", async () => {
    joinGroupAction.mockResolvedValueOnce({
      error: null,
      fieldErrors: { inviteCode: "That code is not valid. Check it with whoever shared it." },
    });
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(
      await screen.findByText("That code is not valid. Check it with whoever shared it."),
    ).toBeInTheDocument();
  });

  it("drops a refused code's message once the code is edited", async () => {
    joinGroupAction.mockResolvedValueOnce({
      error: null,
      fieldErrors: { inviteCode: "That code is not valid. Check it with whoever shared it." },
    });
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));
    expect(
      await screen.findByText("That code is not valid. Check it with whoever shared it."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Invite code"));
    await user.type(screen.getByLabelText("Invite code"), "e5f6g7h8");

    expect(
      screen.queryByText("That code is not valid. Check it with whoever shared it."),
    ).not.toBeInTheDocument();
  });

  it("offers the list when the caller is already in that group", async () => {
    joinGroupAction.mockResolvedValueOnce({ error: null, alreadyMember: true });
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(await screen.findByRole("link", { name: "Open your groups" })).toHaveAttribute(
      "href",
      "/app",
    );
  });

  it("reports a rate limit as an alert, not against the field", async () => {
    joinGroupAction.mockResolvedValueOnce({
      error: "Too many attempts. Please try again in 2 minutes.",
    });
    const user = userEvent.setup({ delay: null });
    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText("Invite code"), "a1b2c3d4");
    await user.click(screen.getByRole("button", { name: "Join group" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });
});
