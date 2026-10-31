// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type RenameState = { error: string | null; done?: boolean };

const renameDeviceAction = vi.fn<(previous: unknown, data: FormData) => Promise<RenameState>>(
  async () => ({ error: null, done: true }),
);

vi.mock("@/app/(app)/app/settings/devices/actions/actions", () => ({
  signOutDeviceAction: vi.fn(),
  removeDeviceAction: vi.fn(),
  renameDeviceAction: (previous: unknown, data: FormData) => renameDeviceAction(previous, data),
}));

import { DeviceRow } from "@/components/app/settings/devices/device-row/device-row";

const BASE = {
  id: 7,
  label: "Chrome on Windows",
  mobile: false,
  current: false,
  active: true,
  ipAddress: "203.0.113.9",
  lastUsed: "14 Oct 2026, 21:40",
};

beforeEach(() => {
  renameDeviceAction.mockClear();
  renameDeviceAction.mockImplementation(async () => ({ error: null, done: true }));
});

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

    expect(screen.getByText("Signed out")).toHaveClass("opacity-60");
    expect(screen.getByRole("button", { name: /Rename/ })).toHaveClass("opacity-60");
    expect(screen.getByRole("button", { name: /Remove/ })).not.toHaveClass("opacity-60");
  });
});

describe("DeviceRow removal", () => {
  it("asks before removing rather than acting on one click", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: /Remove Chrome on Windows/ }));

    expect(screen.getByText("Remove device? You will be signed out of it!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("backs out again on cancel", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: /Remove Chrome on Windows/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Remove device? You will be signed out of it!")).toBeNull();
    expect(screen.getByRole("button", { name: /Sign out/ })).toBeInTheDocument();
  });
});

describe("DeviceRow rename", () => {
  it("turns the name into a field when the name is pressed", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));

    expect(screen.getByLabelText("Device name")).toHaveValue("Chrome on Windows");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("sends the device and the new name", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));
    await user.clear(screen.getByLabelText("Device name"));
    await user.type(screen.getByLabelText("Device name"), "Work laptop");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(renameDeviceAction).toHaveBeenCalledTimes(1);
    expect(renameDeviceAction.mock.calls[0]?.[1]?.get("name")).toBe("Work laptop");
    expect(renameDeviceAction.mock.calls[0]?.[1]?.get("deviceId")).toBe("7");
  });

  it("confirms a save with a pill and closes the field", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
    expect(screen.queryByLabelText("Device name")).toBeNull();
  });

  it("shows a refused save against the name and closes the field", async () => {
    renameDeviceAction.mockImplementation(async () => ({ error: "That name is taken." }));
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That name is taken.");
    expect(screen.queryByLabelText("Device name")).toBeNull();
    expect(screen.getByRole("button", { name: "Rename Chrome on Windows" })).toBeInTheDocument();
  });

  it("aborts the edit when the press lands outside the field", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));
    await user.click(screen.getByText("203.0.113.9"));

    expect(screen.queryByLabelText("Device name")).toBeNull();
    expect(renameDeviceAction).not.toHaveBeenCalled();
  });

  it("closes the field on Escape without saving", async () => {
    const user = userEvent.setup();
    render(<DeviceRow {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Rename Chrome on Windows" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByLabelText("Device name")).toBeNull();
    expect(renameDeviceAction).not.toHaveBeenCalled();
  });
});

describe("DeviceRow with no id", () => {
  it("shows the device but offers nothing it cannot do", () => {
    render(<DeviceRow {...BASE} id={null} />);

    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
