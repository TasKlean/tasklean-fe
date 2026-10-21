// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; done?: boolean };

const saveAppearanceAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, done: true }),
);

vi.mock("@/app/(app)/app/settings/appearance/actions", () => ({
  saveAppearanceAction: (previous: unknown, data: FormData) => saveAppearanceAction(previous, data),
}));

import { AppearanceForm } from "@/components/app/appearance-form/appearance-form";

beforeEach(() => {
  saveAppearanceAction.mockClear();
  saveAppearanceAction.mockImplementation(async () => ({ error: null, done: true }));
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("AppearanceForm", () => {
  it("offers every scheme and marks the saved one", () => {
    render(<AppearanceForm theme="SYSTEM" />);

    expect(screen.getByRole("button", { name: /System/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Dark/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Light/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("sends the scheme that was pressed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AppearanceForm theme="SYSTEM" />);

    await user.click(screen.getByRole("button", { name: /Dark/ }));

    expect(saveAppearanceAction).toHaveBeenCalledTimes(1);
    const data = saveAppearanceAction.mock.calls[0]?.[1];
    expect(data?.get("theme")).toBe("DARK");
  });

  it("repaints the page without waiting for the answer", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AppearanceForm theme="SYSTEM" />);

    await user.click(screen.getByRole("button", { name: /Light/ }));

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("leaves the attribute off for the device's own setting", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AppearanceForm theme="DARK" />);
    document.documentElement.dataset.theme = "dark";

    await user.click(screen.getByRole("button", { name: /System/ }));

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("confirms a save", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AppearanceForm theme="SYSTEM" />);

    await user.click(screen.getByRole("button", { name: /Dark/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your appearance is saved.");
  });

  it("puts the saved scheme back when the save is refused", async () => {
    saveAppearanceAction.mockImplementation(async () => ({ error: "The server said no." }));
    const user = userEvent.setup({ delay: null });
    render(<AppearanceForm theme="LIGHT" />);
    document.documentElement.dataset.theme = "light";

    await user.click(screen.getByRole("button", { name: /Dark/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server said no.");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: /Light/ })).toHaveAttribute("aria-pressed", "true");
  });
});
