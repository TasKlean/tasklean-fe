// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const forgotPasswordAction = vi.fn<
  (previous: unknown, data: FormData) => Promise<{ error: string | null; notice?: string | null }>
>(async () => ({ error: null }));

vi.mock("@/app/(auth)/forgot-password/actions/actions", () => ({
  forgotPasswordAction: (previous: unknown, data: FormData) => forgotPasswordAction(previous, data),
}));

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form/forgot-password-form";

beforeEach(() => {
  forgotPasswordAction.mockClear();
});

describe("ForgotPasswordForm validation", () => {
  it("shows the email error on blur, before any submit", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();

    await user.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("stays quiet when an empty field is blurred", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(screen.getByLabelText("Email address"));
    await user.tab();

    expect(screen.queryByText("Enter your email address.")).toBeNull();
  });

  it("keeps a malformed address off the wire", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(forgotPasswordAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("submits a valid address", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "a@b.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(forgotPasswordAction).toHaveBeenCalledTimes(1);
  });
});

describe("ForgotPasswordForm prefill", () => {
  it("starts with the address carried from login", () => {
    render(<ForgotPasswordForm initialEmail="a@b.test" />);

    expect(screen.getByLabelText("Email address")).toHaveValue("a@b.test");
  });

  it("starts empty when nothing was carried", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });
});

describe("ForgotPasswordForm state", () => {
  it("shows the notice the action returned", async () => {
    forgotPasswordAction.mockResolvedValueOnce({
      error: null,
      notice: "If that address has an account, we have emailed a reset link.",
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "a@b.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("status")).toHaveTextContent("we have emailed a reset link");
  });

  it("shows an error instead of a notice when both could appear", async () => {
    forgotPasswordAction.mockResolvedValueOnce({
      error: "Too many attempts. Please try again in 60 minutes.",
      notice: "If that address has an account, we have emailed a reset link.",
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "a@b.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
