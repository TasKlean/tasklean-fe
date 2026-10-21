// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/common/account-menu/account-menu";

vi.mock("@/app/(app)/actions/actions", () => ({ logoutAction: vi.fn() }));

describe("AccountMenu closed", () => {
  it("shows only the trigger", () => {
    render(<AccountMenu name="Ada" photoUrl={null} />);

    expect(screen.getByRole("button", { name: "Your account" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });
});

describe("AccountMenu open", () => {
  it("offers account, settings and logout", async () => {
    const user = userEvent.setup();
    render(<AccountMenu name="Ada" photoUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Your account" }));

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/app/account");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/app/settings");
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("tells assistive tech that it is open", async () => {
    const user = userEvent.setup();
    render(<AccountMenu name="Ada" photoUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Your account" }));

    expect(screen.getByRole("button", { name: "Your account" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("names who is signed in", async () => {
    const user = userEvent.setup();
    render(<AccountMenu name="Ada" photoUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Your account" }));

    expect(screen.getByText(/Signed in as/)).toBeInTheDocument();
  });

  it("closes on escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<AccountMenu name="Ada" photoUrl={null} />);
    const trigger = screen.getByRole("button", { name: "Your account" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes when the click lands outside it", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AccountMenu name="Ada" photoUrl={null} />
        <button type="button">Somewhere else</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Your account" }));
    await user.click(screen.getByRole("button", { name: "Somewhere else" }));

    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
  });

  it("closes once a destination is chosen", async () => {
    const user = userEvent.setup();
    render(<AccountMenu name="Ada" photoUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Your account" }));
    await user.click(screen.getByRole("link", { name: "Settings" }));

    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
  });
});
