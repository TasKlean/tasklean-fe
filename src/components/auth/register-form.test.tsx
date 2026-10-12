// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registerAction = vi.fn(async () => ({ error: null }));

vi.mock("@/app/(auth)/register/actions", () => ({
  registerAction: (...args: unknown[]) => registerAction(...(args as [])),
}));

import { RegisterForm } from "@/components/auth/register-form";

beforeEach(() => {
  registerAction.mockClear();
});

async function fill(user: ReturnType<typeof userEvent.setup>, password = "Chores12!") {
  await user.type(screen.getByLabelText("First name"), "Maja");
  await user.type(screen.getByLabelText("Last name"), "Novak");
  await user.type(screen.getByLabelText("Email address"), "maja@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.type(screen.getByLabelText("Repeat password"), password);
}

describe("RegisterForm", () => {
  it("shows the password rule on blur", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Password"), "short");
    await user.tab();

    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
  });

  it("stays quiet while tabbing through empty fields", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByLabelText("First name"));
    for (let i = 0; i < 6; i += 1) await user.tab();

    expect(screen.queryByText("Enter your first name.")).toBeNull();
    expect(screen.queryByText("Enter your last name.")).toBeNull();
    expect(screen.queryByText("Choose a password.")).toBeNull();
    expect(screen.queryByText("Repeat your password.")).toBeNull();
  });

  it("replaces the hint with a strength rating once typing starts", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    expect(screen.getByText(/with upper and lower case/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "chores12");

    expect(screen.queryByText(/with upper and lower case/)).toBeNull();
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it.each([
    ["chores12", "Weak"],
    ["Chores12!", "Good"],
    ["Chores12!abc", "Strong"],
  ])("rates %j as %s", async (password, label) => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Password"), password);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("confirms when the repeated password matches", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat password"), "Chores12");
    expect(screen.queryByText("Passwords match")).toBeNull();

    await user.type(screen.getByLabelText("Repeat password"), "!");
    expect(screen.getByText("Passwords match")).toBeInTheDocument();
  });

  it("does not submit a short password", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fill(user, "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(registerAction).not.toHaveBeenCalled();
  });

  it("reports every missing field on an empty submit", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your last name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Choose a password.")).toBeInTheDocument();
    expect(screen.getByText("Repeat your password.")).toBeInTheDocument();
    expect(registerAction).not.toHaveBeenCalled();
  });

  it("shows the password rule as a hint before anything is typed", () => {
    render(<RegisterForm />);

    expect(screen.getByText(/with upper and lower case/)).toBeInTheDocument();
  });

  it("blocks a submit when the repeat does not match", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("First name"), "A");
    await user.type(screen.getByLabelText("Last name"), "B");
    await user.type(screen.getByLabelText("Email address"), "a@b.test");
    await user.type(screen.getByLabelText("Password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat password"), "Chores12?");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(registerAction).not.toHaveBeenCalled();
  });

  it("submits a complete form", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(registerAction).toHaveBeenCalledTimes(1);
  });

  it("keeps the password after a blocked submit", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fill(user, "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Password")).toHaveValue("short");
  });

  it("treats the middle name as optional", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Middle name")).toHaveValue("");
    expect(registerAction).toHaveBeenCalledTimes(1);
  });
});
