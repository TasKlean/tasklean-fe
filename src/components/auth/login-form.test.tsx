// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginAction = vi.fn(async () => ({ error: null }));

vi.mock("@/app/(auth)/login/actions", () => ({
  loginAction: (...args: unknown[]) => loginAction(...(args as [])),
}));

import { LoginForm } from "@/components/auth/login-form";

beforeEach(() => {
  loginAction.mockClear();
});

describe("LoginForm validation", () => {
  it("shows the email error on blur, before any submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();

    await user.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("stays quiet when an empty field is blurred", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByLabelText("Email address"));
    await user.tab();
    await user.tab();

    expect(screen.queryByText("Enter your email address.")).toBeNull();
    expect(screen.queryByText("Enter your password.")).toBeNull();
  });

  it("reports empty fields once submit is attempted", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
  });

  it("hides the error again when the field is cleared", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const email = screen.getByLabelText("Email address");
    await user.type(email, "nope");
    await user.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

    await user.clear(email);
    expect(screen.queryByText("Enter your email address.")).toBeNull();
  });

  it("clears the error as the address is corrected", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email address");
    await user.type(emailInput, "nope");
    await user.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

    await user.type(emailInput, "@example.com");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
  });

  it("does not submit when the email is malformed", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(loginAction).not.toHaveBeenCalled();
  });

  it("keeps the password after a blocked submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByLabelText("Password")).toHaveValue("password123");
    expect(screen.getByLabelText("Email address")).toHaveValue("nope");
  });

  it("submits once both fields are valid", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "a@b.test");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(loginAction).toHaveBeenCalledTimes(1);
  });

  it("reveals the password when the toggle is pressed", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Password"), "password123");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });
});
