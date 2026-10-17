// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  done?: boolean;
  fieldErrors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;
};

const changePasswordAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, done: true }),
);
const setPasswordAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({
    error: null,
    done: true,
  }),
);

vi.mock("@/app/(app)/app/settings/password/actions", () => ({
  changePasswordAction: (previous: unknown, data: FormData) => changePasswordAction(previous, data),
  setPasswordAction: (previous: unknown, data: FormData) => setPasswordAction(previous, data),
}));

import { PasswordForm } from "@/components/app/password-form";

beforeEach(() => {
  changePasswordAction.mockClear();
  setPasswordAction.mockClear();
});

describe("PasswordForm for an account with a password", () => {
  it("asks for the current one", () => {
    render(<PasswordForm passwordSet />);

    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
  });

  it("refuses a new password that repeats the current one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet />);

    await user.type(screen.getByLabelText("Current password"), "Chores12!");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.tab();

    expect(
      screen.getByText("Choose a password different from the current one."),
    ).toBeInTheDocument();
  });

  it("does not submit while a field is invalid", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet />);

    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("submits what was typed, and empties the boxes once it worked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet />);

    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(changePasswordAction).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent(/Your password is changed/);
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });
});

describe("PasswordForm for a Google-only account", () => {
  it("asks for no current password and posts to the other action", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet={false} />);

    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Set password" }));

    expect(setPasswordAction).toHaveBeenCalledTimes(1);
    expect(changePasswordAction).not.toHaveBeenCalled();
  });
});

describe("PasswordForm when the backend refuses", () => {
  it("shows the refusal against the field, until that field is edited", async () => {
    changePasswordAction.mockResolvedValueOnce({
      error: null,
      fieldErrors: { currentPassword: "Current password is incorrect" },
    } as State);
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet />);

    await user.type(screen.getByLabelText("Current password"), "wrongpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Current password"), "x");

    expect(screen.queryByText("Current password is incorrect")).not.toBeInTheDocument();
  });
});
