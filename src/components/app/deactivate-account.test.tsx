// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type DeactivateState = { error: string | null; fieldErrors?: { password?: string } };

const deactivateAccountAction = vi.fn<
  (previous: unknown, data: FormData) => Promise<DeactivateState>
>(async () => ({ error: null }));

vi.mock("@/app/(app)/app/settings/deactivate/actions", () => ({
  deactivateAccountAction: (previous: unknown, data: FormData) =>
    deactivateAccountAction(previous, data),
}));

import { DeactivateAccount } from "@/components/app/deactivate-account";

beforeEach(() => {
  deactivateAccountAction.mockClear();
  deactivateAccountAction.mockImplementation(async () => ({ error: null }));
});

describe("DeactivateAccount", () => {
  it("confirms in place rather than closing the account on one press", async () => {
    const user = userEvent.setup({ delay: null });
    render(<DeactivateAccount passwordSet={false} />);

    await user.click(screen.getByRole("button", { name: "Deactivate my account" }));

    expect(deactivateAccountAction).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Yes, deactivate my account" })).toBeEnabled();
  });

  it("waits for the password when the account has one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<DeactivateAccount passwordSet />);

    await user.click(screen.getByRole("button", { name: "Deactivate my account" }));

    expect(screen.getByRole("button", { name: "Yes, deactivate my account" })).toBeDisabled();

    await user.type(screen.getByLabelText("Your password"), "Chores12!");

    expect(screen.getByRole("button", { name: "Yes, deactivate my account" })).toBeEnabled();
  });

  it("asks for no password from a Google-only account", async () => {
    const user = userEvent.setup({ delay: null });
    render(<DeactivateAccount passwordSet={false} />);

    await user.click(screen.getByRole("button", { name: "Deactivate my account" }));

    expect(screen.queryByLabelText("Your password")).not.toBeInTheDocument();
  });

  it("shows a refused password against the field that asked for it", async () => {
    deactivateAccountAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { password: "Current password is incorrect" },
    }));
    const user = userEvent.setup({ delay: null });
    render(<DeactivateAccount passwordSet />);

    await user.click(screen.getByRole("button", { name: "Deactivate my account" }));
    await user.type(screen.getByLabelText("Your password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Yes, deactivate my account" }));

    expect(await screen.findByText("Current password is incorrect")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
