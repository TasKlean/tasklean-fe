// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const removeAllDevicesAction = vi.fn<(previous: unknown) => Promise<State>>(async () => ({
  error: null,
}));

vi.mock("@/app/(app)/app/settings/devices/actions/actions", () => ({
  signOutEverywhereAction: vi.fn(async () => ({ error: null })),
  removeAllDevicesAction: (previous: unknown) => removeAllDevicesAction(previous),
}));

import { AllDeviceActions } from "@/components/app/settings/devices/all-device-actions/all-device-actions";

beforeEach(() => {
  removeAllDevicesAction.mockClear();
  removeAllDevicesAction.mockImplementation(async () => ({ error: null }));
});

describe("AllDeviceActions", () => {
  it("offers both account-wide actions", () => {
    render(<AllDeviceActions />);

    expect(screen.getByRole("button", { name: "Sign out everywhere" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove all devices" })).toBeInTheDocument();
  });

  it("asks before removing everything, in the words of the consequence", async () => {
    const user = userEvent.setup();
    render(<AllDeviceActions />);

    await user.click(screen.getByRole("button", { name: "Remove all devices" }));

    expect(screen.getByText(/sign you out of all of them and forget them/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, remove all devices" })).toBeInTheDocument();
    expect(removeAllDevicesAction).not.toHaveBeenCalled();
  });

  it("asks one question at a time", async () => {
    const user = userEvent.setup();
    render(<AllDeviceActions />);

    await user.click(screen.getByRole("button", { name: "Remove all devices" }));

    expect(screen.queryByRole("button", { name: "Yes, sign out everywhere" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign out everywhere" })).toBeNull();
  });

  it("backs out again on cancel", async () => {
    const user = userEvent.setup();
    render(<AllDeviceActions />);

    await user.click(screen.getByRole("button", { name: "Remove all devices" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Remove all devices" })).toBeInTheDocument();
    expect(screen.queryByText(/forget them/)).toBeNull();
  });

  it("removes everything once the question is answered", async () => {
    const user = userEvent.setup();
    render(<AllDeviceActions />);

    await user.click(screen.getByRole("button", { name: "Remove all devices" }));
    await user.click(screen.getByRole("button", { name: "Yes, remove all devices" }));

    expect(removeAllDevicesAction).toHaveBeenCalledTimes(1);
  });

  it("reports a refused removal rather than swallowing it", async () => {
    removeAllDevicesAction.mockImplementation(async () => ({ error: "The server said no." }));
    const user = userEvent.setup();
    render(<AllDeviceActions />);

    await user.click(screen.getByRole("button", { name: "Remove all devices" }));
    await user.click(screen.getByRole("button", { name: "Yes, remove all devices" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server said no.");
  });
});
