// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyAction = vi.fn(async () => ({ error: null }));
const resendAction = vi.fn(async () => ({ error: null }));

vi.mock("@/app/(auth)/verify-email/actions", () => ({
  verifyAction: (...args: unknown[]) => verifyAction(...(args as [])),
  resendAction: (...args: unknown[]) => resendAction(...(args as [])),
}));

import { VerifyEmailForm } from "@/components/auth/verify-email-form";

function codeValue(): string {
  return (document.querySelector('input[type="hidden"][name="code"]') as HTMLInputElement).value;
}

beforeEach(() => {
  verifyAction.mockClear();
  resendAction.mockClear();
  window.history.replaceState(null, "", "/verify-email");
});

describe("VerifyEmailForm", () => {
  it("shows a known address as text, not an editable field", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" />);

    expect(screen.getByText("a@b.test")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).toBeNull();
    expect(
      (document.querySelector('input[type="hidden"][name="email"]') as HTMLInputElement).value,
    ).toBe("a@b.test");
  });

  it("asks for the address when it was not given", () => {
    render(<VerifyEmailForm />);

    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });

  it("prefills the code from the email link without submitting it", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" initialCode="123456" />);

    expect(codeValue()).toBe("123456");
    expect(screen.getByLabelText("Digit 1")).toHaveValue("1");
    expect(verifyAction).not.toHaveBeenCalled();
  });

  it("removes the code from the URL once read", () => {
    window.history.replaceState(null, "", "/verify-email?email=a%40b.test&code=123456");

    render(<VerifyEmailForm initialEmail="a@b.test" initialCode="123456" />);

    expect(window.location.search).toBe("?email=a%40b.test");
    expect(codeValue()).toBe("123456");
  });

  it("counts down when this visit sent the code", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" />);

    expect(screen.getByText("Code expires in 5:00")).toBeInTheDocument();
  });

  it("does not invent a countdown when arriving from the email link", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" initialCode="123456" />);

    expect(screen.queryByText(/Code expires in/)).toBeNull();
    expect(screen.getByText("Codes expire 5 minutes after they are sent.")).toBeInTheDocument();
  });

  it("warns that an earlier code is dead when login resent one", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" codeResent />);

    expect(
      screen.getByText("We sent you a new code. Any earlier code no longer works."),
    ).toBeInTheDocument();
  });

  it("says nothing about a new code when arriving from register", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" />);

    expect(screen.queryByText(/new code/)).toBeNull();
  });

  it("starts the resend cooldown disabled", () => {
    render(<VerifyEmailForm initialEmail="a@b.test" />);

    expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();
  });

  it("will not resend without a usable address", () => {
    render(<VerifyEmailForm />);

    expect(screen.getByRole("button", { name: /Resend/ })).toBeDisabled();
  });
});
