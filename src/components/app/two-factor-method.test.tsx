// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { Mail } from "lucide-react";
import { describe, expect, it } from "vitest";
import { TwoFactorMethod } from "@/components/app/two-factor-method";

const PROPS = { icon: Mail, name: "Email", description: "A code sent to your address." };

describe("TwoFactorMethod", () => {
  it("names the method and what it does", () => {
    render(<TwoFactorMethod {...PROPS} />);

    expect(screen.getByText("Email")).toBeVisible();
    expect(screen.getByText("A code sent to your address.")).toBeVisible();
  });

  it("shows the state when there is one", () => {
    render(<TwoFactorMethod {...PROPS} badge={{ label: "On", tone: "on" }} />);

    expect(screen.getByText("On")).toBeVisible();
  });

  it("shows no badge for a method with no state to be in", () => {
    render(<TwoFactorMethod {...PROPS} available={false} />);

    expect(screen.queryByText("On")).toBeNull();
    expect(screen.queryByText("Off")).toBeNull();
  });

  it("offers a dead button for a method that cannot be turned on yet", () => {
    render(<TwoFactorMethod {...PROPS} available={false} />);

    expect(screen.getByRole("button", { name: "Coming soon" })).toBeDisabled();
  });

  it("renders what an available method offers", () => {
    render(
      <TwoFactorMethod {...PROPS}>
        <button type="button">Set up</button>
      </TwoFactorMethod>,
    );

    expect(screen.getByRole("button", { name: "Set up" })).toBeEnabled();
  });

  it("keeps an unavailable method's children off the screen", () => {
    render(
      <TwoFactorMethod {...PROPS} available={false}>
        <button type="button">Set up</button>
      </TwoFactorMethod>,
    );

    expect(screen.queryByRole("button", { name: "Set up" })).toBeNull();
  });
});
