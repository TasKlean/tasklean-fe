// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeviceRow } from "@/components/app/device-row";

vi.mock("@/app/(app)/app/settings/devices/actions", () => ({
  signOutDeviceAction: vi.fn(),
  removeDeviceAction: vi.fn(),
}));

const BASE = {
  id: 7,
  label: "Chrome on Windows",
  mobile: false,
  current: false,
  active: true,
  ipAddress: "203.0.113.9",
  lastUsed: "14 Oct 2026, 21:40",
};

describe("DeviceRow for a live session", () => {
  it("offers both ways to end it", () => {
    render(<DeviceRow {...BASE} />);

    expect(screen.getByRole("button", { name: /Sign out/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
  });

  it("says it is signed in", () => {
    render(<DeviceRow {...BASE} />);

    expect(screen.getByText("Signed in")).toBeInTheDocument();
  });

  it("marks the browser being used", () => {
    render(<DeviceRow {...BASE} current />);

    expect(screen.getByText("This device")).toBeInTheDocument();
  });
});

describe("DeviceRow for a dead session", () => {
  it("offers removal but not a sign-out, which would do nothing", () => {
    render(<DeviceRow {...BASE} active={false} />);

    expect(screen.queryByRole("button", { name: /Sign out/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
  });

  it("reads as inactive without dimming the way out", () => {
    render(<DeviceRow {...BASE} active={false} />);

    expect(screen.getByText("Signed out").parentElement).toHaveClass("opacity-60");
    expect(screen.getByRole("button", { name: /Remove/ })).not.toHaveClass("opacity-60");
  });
});

describe("DeviceRow removal", () => {
  it("asks before removing rather than acting on one click", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: /Remove Chrome on Windows/ }));

    expect(screen.getByText("Remove it?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("backs out again on cancel", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: /Remove Chrome on Windows/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Remove it?")).toBeNull();
    expect(screen.getByRole("button", { name: /Sign out/ })).toBeInTheDocument();
  });
});

describe("DeviceRow with no id", () => {
  it("shows the device but offers nothing it cannot do", () => {
    render(<DeviceRow {...BASE} id={null} />);

    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
