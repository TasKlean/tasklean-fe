// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordAction = vi.fn<
  (previous: unknown, data: FormData) => Promise<{ error: string | null }>
>(async () => ({ error: null }));

vi.mock("@/app/(auth)/reset-password/actions/actions", () => ({
  resetPasswordAction: (previous: unknown, data: FormData) => resetPasswordAction(previous, data),
}));

import { ResetPasswordForm } from "@/components/auth/reset-password-form/reset-password-form";

beforeEach(() => {
  resetPasswordAction.mockClear();
});

describe("ResetPasswordForm validation", () => {
  it("shows the first unmet policy rule on blur", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok-1" />);

    await user.type(screen.getByLabelText("New password"), "chores12!");
    await user.tab();

    expect(screen.getByText("Add an uppercase letter.")).toBeInTheDocument();
  });

  it("confirms a matching repeat", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok-1" />);

    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");

    expect(screen.getByText("Passwords match")).toBeInTheDocument();
  });

  it("keeps a weak password off the wire, so the token survives", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok-1" />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Repeat new password"), "short");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(resetPasswordAction).not.toHaveBeenCalled();
    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
  });

  it("submits a policy-compliant pair", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok-1" />);

    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(resetPasswordAction).toHaveBeenCalledTimes(1);
  });
});

describe("ResetPasswordForm token", () => {
  it("carries the emailed token so the action works without JavaScript", () => {
    const { container } = render(<ResetPasswordForm token="tok-1" />);

    expect(container.querySelector('input[name="token"]')).toHaveValue("tok-1");
  });

  it("shows the action's error as a banner", async () => {
    resetPasswordAction.mockResolvedValueOnce({
      error: "Invalid or expired reset token",
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm token="spent" />);

    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired reset token");
  });
});
