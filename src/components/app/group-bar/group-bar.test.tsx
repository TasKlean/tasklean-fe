// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/groups/g1" }));

import { GroupBar } from "@/components/app/group-bar/group-bar";

describe("GroupBar", () => {
  it("offers adding a task, which is not built yet", () => {
    render(<GroupBar uid="g1" inviteCode={null} />);

    expect(screen.getByRole("button", { name: "Add task, coming soon" })).toBeDisabled();
  });

  it("keeps the group's sections behind a press", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode={null} />);

    expect(screen.queryByRole("link", { name: "Overview" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Group sections" }));

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/app/groups/g1",
    );
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "href",
      "/app/groups/g1/members",
    );
    expect(screen.getByRole("button", { name: "Settings, coming soon" })).toBeDisabled();
  });

  it("closes the sections once one is chosen", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode={null} />);

    await user.click(screen.getByRole("button", { name: "Group sections" }));
    await user.click(screen.getByRole("link", { name: "Overview" }));

    expect(screen.queryByRole("link", { name: "Overview" })).toBeNull();
  });

  it("hands an admin the code to share", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode="7KQ2M4" />);

    await user.click(screen.getByRole("button", { name: "Invite someone" }));

    expect(screen.getByText("7KQ2M4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("offers no invite control to someone with no code", () => {
    render(<GroupBar uid="g1" inviteCode={null} />);

    expect(screen.queryByRole("button", { name: "Invite someone" })).toBeNull();
  });

  it("shows one panel at a time", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode="7KQ2M4" />);

    await user.click(screen.getByRole("button", { name: "Invite someone" }));
    await user.click(screen.getByRole("button", { name: "Group sections" }));

    expect(screen.queryByText("7KQ2M4")).toBeNull();
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
  });

  it("keeps the open panel while a press lands on the other control", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode="7KQ2M4" />);

    await user.click(screen.getByRole("button", { name: "Invite someone" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Group sections" }));

    expect(screen.getByText("7KQ2M4")).toBeInTheDocument();
  });

  it("closes the open panel on a press outside the bar", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode="7KQ2M4" />);

    await user.click(screen.getByRole("button", { name: "Invite someone" }));
    fireEvent.pointerDown(document.body);

    expect(screen.queryByText("7KQ2M4")).toBeNull();
  });

  it("names the task pill while nothing else is open, and gives the name up when something is", async () => {
    const user = userEvent.setup();
    render(<GroupBar uid="g1" inviteCode="7KQ2M4" />);

    expect(screen.getByText("Add task")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Invite someone" }));

    expect(screen.getByText("Add task")).toHaveClass("hidden");
    expect(screen.getByText("Invite")).not.toHaveClass("hidden");
  });
});
