// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  done?: boolean;
  fieldErrors?: Partial<
    Record<"currentPassword" | "newPassword" | "confirmPassword" | "code", string>
  >;
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

vi.mock("@/app/(app)/app/settings/password/actions/actions", () => ({
  changePasswordAction: (previous: unknown, data: FormData) => changePasswordAction(previous, data),
  setPasswordAction: (previous: unknown, data: FormData) => setPasswordAction(previous, data),
}));

import { PasswordForm } from "@/components/app/password-form/password-form";

beforeEach(() => {
  changePasswordAction.mockClear();
  setPasswordAction.mockClear();
});

describe("PasswordForm for an account with a password", () => {
  it("asks for the current one", () => {
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
  });

  it("offers the reset flow, for someone who forgot the password they are signed in with", () => {
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("carries the address into the reset link, so it is not typed again", () => {
    render(<PasswordForm passwordSet twoFactorEnabled={false} email="bob+1@tasklean.test" />);

    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password?email=bob%2B1%40tasklean.test",
    );
  });

  it("refuses a new password that repeats the current one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    await user.type(screen.getByLabelText("Current password"), "Chores12!");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.tab();

    expect(
      screen.getByText("Choose a password different from the current one."),
    ).toBeInTheDocument();
  });

  it("does not submit while a field is invalid", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("submits what was typed, and empties the boxes once it worked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

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
    render(<PasswordForm passwordSet={false} twoFactorEnabled={false} email={null} />);

    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Forgot password?" })).not.toBeInTheDocument();

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
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    await user.type(screen.getByLabelText("Current password"), "wrongpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Current password"), "x");

    expect(screen.queryByText("Current password is incorrect")).not.toBeInTheDocument();
  });
});

describe("PasswordForm when the account has two-factor on", () => {
  it("asks for a code as well as the passwords", () => {
    render(<PasswordForm passwordSet twoFactorEnabled email={null} />);

    expect(screen.getByLabelText("Digit 1")).toBeInTheDocument();
  });

  it("asks for no code when the account has no factor", () => {
    render(<PasswordForm passwordSet twoFactorEnabled={false} email={null} />);

    expect(screen.queryByLabelText("Digit 1")).not.toBeInTheDocument();
  });

  it("does not submit on a complete code while the passwords are empty", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled email={null} />);

    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("sends the code with the passwords it belongs to", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled email={null} />);

    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(changePasswordAction).toHaveBeenCalledTimes(1);
    expect(changePasswordAction.mock.calls[0][1].get("code")).toBe("123456");
  });

  it("takes a recovery code in place of the six digits", async () => {
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled email={null} />);

    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));
    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.type(screen.getByLabelText("Recovery code"), "aaaa-1111");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(changePasswordAction.mock.calls[0][1].get("code")).toBe("aaaa-1111");
  });

  it("shows a refused code against the code field", async () => {
    changePasswordAction.mockResolvedValueOnce({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    } as State);
    const user = userEvent.setup({ delay: null });
    render(<PasswordForm passwordSet twoFactorEnabled email={null} />);

    await user.type(screen.getByLabelText("Current password"), "oldpass");
    await user.type(screen.getByLabelText("New password"), "Chores12!");
    await user.type(screen.getByLabelText("Repeat new password"), "Chores12!");
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(await screen.findByText("That code is not valid.")).toBeInTheDocument();
  });
});
