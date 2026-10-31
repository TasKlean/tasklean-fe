// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SetupState = {
  error: string | null;
  fieldErrors?: { password?: string };
  enrollment?: { secret: string; otpauthUri: string; qr: { size: number; path: string } };
};

type EnableState = {
  error: string | null;
  fieldErrors?: { code?: string };
  done?: boolean;
  recoveryCodes?: string[];
};

const startSetupAction = vi.fn<(previous: unknown, data: FormData) => Promise<SetupState>>(
  async () => ({ error: null }),
);

const enableAction = vi.fn<(previous: unknown, data: FormData) => Promise<EnableState>>(
  async () => ({ error: null }),
);

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@/app/(app)/app/settings/two-factor/actions/actions", () => ({
  startSetupAction: (previous: unknown, data: FormData) => startSetupAction(previous, data),
  enableAction: (previous: unknown, data: FormData) => enableAction(previous, data),
}));

import { TwoFactorEnroll } from "@/components/app/settings/two-factor/two-factor-enroll/two-factor-enroll";

const ENROLLMENT = {
  secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/TasKlean:a@b.c?secret=JBSWY3DPEHPK3PXP",
  qr: { size: 25, path: "M2 2h7v1h-7z" },
};

const PROPS = {
  enabled: false,
  passwordSet: true,
  pendingSetup: false,
  doneHref: "/app/settings/two-factor",
};

beforeEach(() => {
  refresh.mockClear();
  startSetupAction.mockClear();
  enableAction.mockClear();
  startSetupAction.mockImplementation(async () => ({ error: null }));
  enableAction.mockImplementation(async () => ({ error: null }));
});

type User = ReturnType<typeof userEvent.setup>;

async function open(user: User, label: RegExp = /Set up/) {
  await user.click(screen.getByRole("button", { name: label }));
}

async function resume(user: User) {
  await open(user, /Finish setting up/);
}

async function startSetup(user: User, password = "Chores12!") {
  await open(user);
  await user.type(screen.getByLabelText("Your password"), password);
  await user.click(screen.getByRole("button", { name: /Start setting up/ }));
}

describe("TwoFactorEnroll", () => {
  it("offers a button rather than a form until it is asked for", () => {
    render(<TwoFactorEnroll {...PROPS} />);

    expect(screen.getByRole("button", { name: /Set up/ })).toBeVisible();
    expect(screen.queryByLabelText("Your password")).toBeNull();
  });

  it("says the setup is unfinished on the button itself", () => {
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    expect(screen.getByRole("button", { name: /Finish setting up/ })).toBeVisible();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("asks for the password before it asks for anything else", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await open(user);

    expect(screen.getByLabelText("Your password")).toBeVisible();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("asks a Google-only account for no password at all", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} passwordSet={false} />);

    await open(user);

    expect(screen.queryByLabelText("Your password")).toBeNull();
    expect(screen.getByRole("button", { name: /Start setting up/ })).toBeEnabled();
  });

  it("waits for a password before it will start", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await open(user);

    expect(screen.getByRole("button", { name: /Start setting up/ })).toBeDisabled();
  });

  it("sends the password that was typed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await startSetup(user);

    expect(startSetupAction.mock.calls[0]?.[1]?.get("password")).toBe("Chores12!");
  });

  it("shows the refusal against the password, not as a page failure", async () => {
    startSetupAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { password: "Current password is incorrect" },
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await startSetup(user, "wrong");

    expect(await screen.findByText("Current password is incorrect")).toBeVisible();
  });

  it("shows the QR code and the key behind it once setup answers", async () => {
    startSetupAction.mockImplementation(async () => ({ error: null, enrollment: ENROLLMENT }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await startSetup(user);

    expect(
      await screen.findByRole("img", { name: "Scan this with your authenticator app" }),
    ).toBeVisible();
    expect(screen.getByText(ENROLLMENT.secret)).toBeVisible();
    expect(screen.getByRole("link", { name: "Open in app" })).toHaveAttribute(
      "href",
      ENROLLMENT.otpauthUri,
    );
  });

  it("asks for the code once there is something to confirm", async () => {
    startSetupAction.mockImplementation(async () => ({ error: null, enrollment: ENROLLMENT }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} />);

    await startSetup(user);

    expect(await screen.findByLabelText("Digit 1")).toBeVisible();
    expect(screen.queryByLabelText("Your password")).toBeNull();
  });

  it("offers to finish a pending setup, with no QR code to show for it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);

    expect(screen.getByLabelText("Digit 1")).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText(/still in your/)).toBeVisible();
  });

  it("asks for the password again when starting a pending setup over", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.click(screen.getByRole("button", { name: /Start again/ }));

    expect(screen.getByLabelText("Your password")).toBeVisible();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("refuses to send a code that is not six digits", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123");
    await user.click(screen.getByRole("button", { name: /Turn on two-factor/ }));

    expect(enableAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter all 6 digits.")).toBeVisible();
  });

  it("sends the six digits it was given", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(enableAction.mock.calls[0]?.[1]?.get("code")).toBe("123456");
  });

  it("shows a refused code against the field, so it can be retyped", async () => {
    enableAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(await screen.findByText("That code is not valid.")).toBeVisible();
    expect(screen.getByLabelText("Digit 1")).toBeVisible();
  });

  it("shows the recovery codes once the factor is on", async () => {
    enableAction.mockImplementation(async () => ({
      error: null,
      done: true,
      recoveryCodes: ["abcd-2345", "efgh-6789"],
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(await screen.findByText("abcd-2345")).toBeVisible();
    expect(screen.getByText(/Two-factor is on/)).toBeVisible();
  });

  it("offers nothing to an account that already has it on", () => {
    render(<TwoFactorEnroll {...PROPS} enabled />);

    expect(screen.queryByLabelText("Your password")).toBeNull();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("keeps the codes on screen when the page comes back saying it is on", async () => {
    enableAction.mockImplementation(async () => ({
      error: null,
      done: true,
      recoveryCodes: ["abcd-2345", "efgh-6789"],
    }));
    const user = userEvent.setup({ delay: null });
    const { rerender } = render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");
    expect(await screen.findByText("abcd-2345")).toBeVisible();

    rerender(<TwoFactorEnroll {...PROPS} pendingSetup enabled />);

    expect(screen.getByText("abcd-2345")).toBeVisible();
  });

  it("clears the codes and re-reads the state once they are saved", async () => {
    enableAction.mockImplementation(async () => ({
      error: null,
      done: true,
      recoveryCodes: ["abcd-2345"],
    }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");
    await user.click(await screen.findByRole("link", { name: "I have saved them" }));

    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByText("abcd-2345")).toBeNull();
    expect(screen.queryByRole("button", { name: /Set up/ })).toBeNull();
  });

  it("says plainly when the codes did not come back", async () => {
    enableAction.mockImplementation(async () => ({ error: null, done: true, recoveryCodes: [] }));
    const user = userEvent.setup({ delay: null });
    render(<TwoFactorEnroll {...PROPS} pendingSetup />);

    await resume(user);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(await screen.findByText(/No recovery codes came back/)).toBeVisible();
    expect(screen.getByText(/Two-factor is on/)).toBeVisible();
  });
});
