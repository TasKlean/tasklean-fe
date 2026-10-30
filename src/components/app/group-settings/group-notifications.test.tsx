// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupNotifications } from "@/components/app/group-settings/group-notifications";

describe("GroupNotifications", () => {
  it("offers the per-group choice as a control that cannot be used yet", () => {
    render(<GroupNotifications />);

    expect(
      screen.getByRole("button", { name: "Choose this group's notifications, coming soon" }),
    ).toBeDisabled();
  });

  it("points at the account-wide settings, which do work", () => {
    render(<GroupNotifications />);

    expect(screen.getByRole("link", { name: "Account notifications" })).toHaveAttribute(
      "href",
      "/app/settings/notifications",
    );
  });

  it("says what happens until then", () => {
    render(<GroupNotifications />);

    expect(screen.getByText(/every group follows the notification settings/)).toBeInTheDocument();
  });
});
