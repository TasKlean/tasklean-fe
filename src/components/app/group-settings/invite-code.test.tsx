// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/settings/actions/actions", () => ({
  rotateInviteCodeAction: vi.fn(),
}));

import { InviteCode } from "@/components/app/group-settings/invite-code";

describe("InviteCode", () => {
  it("shows the code and the three things an admin does with it", () => {
    render(<InviteCode groupUid="g1" code="7KQ2M4" />);

    expect(screen.getByText("7KQ2M4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy invite code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share the code, coming soon" })).toBeDisabled();
  });
});
