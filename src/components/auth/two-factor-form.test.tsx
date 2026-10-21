// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; fieldErrors?: { code?: string } };

const verifyTwoFactorAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(auth)/two-factor/actions", () => ({
  verifyTwoFactorAction: (previous: unknown, data: FormData) =>
    verifyTwoFactorAction(previous, data),
}));

import { TwoFactorForm } from "@/components/auth/two-factor-form";

function codeValue(): string {
  return (document.querySelector('input[type="hidden"][name="code"]') as HTMLInputElement).value;
}

function sentCode(): unknown {
  return verifyTwoFactorAction.mock.calls[0]?.[1]?.get("code");
}

beforeEach(() => {
  verifyTwoFactorAction.mockClear();
  verifyTwoFactorAction.mockImplementation(async () => ({ error: null }));
});

describe("TwoFactorForm", () => {
  it("asks for the authenticator code first", () => {
    render(<TwoFactorForm />);

    expect(screen.getByLabelText("Digit 1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Recovery code")).toBeNull();
  });

  it("sends the six digits as soon as they are typed, with no press needed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(verifyTwoFactorAction).toHaveBeenCalledTimes(1);
    expect(sentCode()).toBe("123456");
  });

  it("swaps in a single field for a recovery code", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));

    expect(screen.getByLabelText("Recovery code")).toBeInTheDocument();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("sends a recovery code as it was typed, hyphen and all", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));
    await user.type(screen.getByLabelText("Recovery code"), "bxmb-jva7");
    await user.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(sentCode()).toBe("bxmb-jva7");
  });

  it("drops a half-typed code when the kind changes", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "123");
    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));
    await user.click(screen.getByRole("button", { name: "Use your authenticator app instead" }));

    expect(codeValue()).toBe("");
  });

  it("blocks a short code before it costs a round trip", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "123");
    await user.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(verifyTwoFactorAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter the 6 digits from your app, or a recovery code.")).toBeVisible();
  });

  it("reports what the server said about the code", async () => {
    verifyTwoFactorAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "000000");

    expect(await screen.findByText("That code is not valid.")).toBeVisible();
  });

  it("keeps the refused code on screen so one digit can be fixed", async () => {
    verifyTwoFactorAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "000000");

    expect(await screen.findByText("That code is not valid.")).toBeVisible();
    expect(codeValue()).toBe("000000");
    expect(screen.getByLabelText("Digit 1")).toHaveValue("0");
    expect(screen.getByLabelText("Digit 6")).toHaveValue("0");
  });

  it("shows a rate limit as a banner", async () => {
    verifyTwoFactorAction.mockImplementation(async () => ({
      error: "Too many attempts. Please try again in 2 minutes.",
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm />);

    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts.");
  });

  it("carries the next path for the action", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorForm next="/app/account" />);

    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(verifyTwoFactorAction.mock.calls[0]?.[1]?.get("next")).toBe("/app/account");
  });
});
