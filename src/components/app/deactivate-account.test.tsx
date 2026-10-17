// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deactivateAccountAction = vi.fn<
  (previous: unknown, data: FormData) => Promise<{ error: string | null }>
>(async () => ({ error: null }));

vi.mock("@/app/(app)/app/settings/deactivate/actions", () => ({
  deactivateAccountAction: (previous: unknown, data: FormData) =>
    deactivateAccountAction(previous, data),
}));

import { DeactivateAccount } from "@/components/app/deactivate-account";

beforeEach(() => {
  deactivateAccountAction.mockClear();
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
});
