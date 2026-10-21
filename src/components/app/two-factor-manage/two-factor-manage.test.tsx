// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ConfirmState = {
  error: string | null;
  fieldErrors?: { password?: string; code?: string };
  done?: boolean;
  recoveryCodes?: string[];
};

type Action = (previous: unknown, data: FormData) => Promise<ConfirmState>;

const disableAction = vi.fn<Action>(async () => ({ error: null }));

const regenerateCodesAction = vi.fn<Action>(async () => ({ error: null }));

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@/app/(app)/app/settings/two-factor/actions/actions", () => ({
  disableAction: (previous: unknown, data: FormData) => disableAction(previous, data),
  regenerateCodesAction: (previous: unknown, data: FormData) =>
    regenerateCodesAction(previous, data),
}));

import { TwoFactorManage } from "@/components/app/two-factor-manage/two-factor-manage";

const PROPS = { enabled: true, passwordSet: true, doneHref: "/app/settings/two-factor" };

const NEW_CODES = ["CCCC3333", "DDDD4444"];

beforeEach(() => {
  refresh.mockClear();
  disableAction.mockClear();
  regenerateCodesAction.mockClear();
  disableAction.mockImplementation(async () => ({ error: null }));
  regenerateCodesAction.mockImplementation(async () => ({ error: null }));
});

type User = ReturnType<typeof userEvent.setup>;

async function open(user: User, label: RegExp) {
  await user.click(screen.getByRole("button", { name: label }));
}

async function confirmWith(user: User, code: string, password = "Chores12!") {
  if (password) await user.type(screen.getByLabelText("Your password"), password);
  await user.type(screen.getByLabelText("Digit 1"), code);
}

describe("TwoFactorManage", () => {
  it("offers nothing while the factor is off", () => {
    render(<TwoFactorManage {...PROPS} enabled={false} />);

    expect(screen.queryByRole("button", { name: /Turn off two-factor/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Get new recovery codes/ })).toBeNull();
  });

  it("offers both operations while it is on", () => {
    render(<TwoFactorManage {...PROPS} />);

    expect(screen.getByRole("button", { name: /Get new recovery codes/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Turn off two-factor/ })).toBeEnabled();
  });

  it("asks for both credentials before turning it off", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);

    expect(screen.getByLabelText("Your password")).toBeVisible();
    expect(screen.getByLabelText("Digit 1")).toBeVisible();
  });

  it("sends both credentials as soon as the code is complete", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "123456");

    expect(disableAction).toHaveBeenCalledTimes(1);
    const sent = disableAction.mock.calls[0][1];
    expect(sent.get("password")).toBe("Chores12!");
    expect(sent.get("code")).toBe("123456");
  });

  it("waits for the password even once the code is complete", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(disableAction).not.toHaveBeenCalled();
  });

  it("asks for no password on an account that has none", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} passwordSet={false} />);

    await open(user, /Turn off two-factor/);
    await user.type(screen.getByLabelText("Digit 1"), "123456");

    expect(screen.queryByLabelText("Your password")).toBeNull();
    expect(disableAction).toHaveBeenCalledTimes(1);
  });

  it("takes a recovery code in place of one from the app", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await user.type(screen.getByLabelText("Your password"), "Chores12!");
    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));
    await user.type(screen.getByLabelText("Recovery code"), "aaaa-1111");
    await user.click(screen.getByRole("button", { name: "Turn it off" }));

    expect(disableAction.mock.calls[0][1].get("code")).toBe("aaaa-1111");
  });

  it("confirms that the factor is off", async () => {
    disableAction.mockImplementation(async () => ({ error: null, done: true }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "123456");

    expect(await screen.findByText(/Two-factor is off/)).toBeVisible();
  });

  it("keeps that confirmation once the page re-reads the factor as gone", async () => {
    disableAction.mockImplementation(async () => ({ error: null, done: true }));
    const user = userEvent.setup();
    const { rerender } = render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "123456");
    await screen.findByText(/Two-factor is off/);
    rerender(<TwoFactorManage {...PROPS} enabled={false} />);

    expect(screen.getByText(/Two-factor is off/)).toBeVisible();
  });

  it("shows a refused password against that field", async () => {
    disableAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { password: "Current password is incorrect" },
    }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "123456");

    expect(await screen.findByText("Current password is incorrect")).toBeVisible();
  });

  it("shows a refused code against the code field", async () => {
    disableAction.mockImplementation(async () => ({
      error: null,
      fieldErrors: { code: "That code is not valid." },
    }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "000000");

    expect(await screen.findByText("That code is not valid.")).toBeVisible();
  });

  it("reports a failure that was about neither field", async () => {
    disableAction.mockImplementation(async () => ({ error: "Too many attempts." }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await confirmWith(user, "123456");

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts.");
  });

  it("goes back to the two choices on cancel", async () => {
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Turn off two-factor/);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: /Get new recovery codes/ })).toBeEnabled();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();
  });

  it("shows the new recovery codes once they come back", async () => {
    regenerateCodesAction.mockImplementation(async () => ({
      error: null,
      done: true,
      recoveryCodes: NEW_CODES,
    }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Get new recovery codes/);
    await confirmWith(user, "123456");

    expect(await screen.findByText("CCCC3333")).toBeVisible();
    expect(screen.getByText("DDDD4444")).toBeVisible();
  });

  it("re-reads the count once the new codes are saved", async () => {
    regenerateCodesAction.mockImplementation(async () => ({
      error: null,
      done: true,
      recoveryCodes: NEW_CODES,
    }));
    const user = userEvent.setup();
    render(<TwoFactorManage {...PROPS} />);

    await open(user, /Get new recovery codes/);
    await confirmWith(user, "123456");
    await user.click(await screen.findByRole("link", { name: "I have saved them" }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Get new recovery codes/ })).toBeEnabled();
  });
});
