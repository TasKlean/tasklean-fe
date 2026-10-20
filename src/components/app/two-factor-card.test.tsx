// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TwoFactorCard } from "@/components/app/two-factor-card";
import type { TwoFactorStatus } from "@/lib/account/two-factor.types";

const OFF: TwoFactorStatus = {
  enabled: false,
  pendingSetup: false,
  confirmedAt: null,
  recoveryCodesRemaining: 0,
};

function status(overrides: Partial<TwoFactorStatus> = {}): TwoFactorStatus {
  return { ...OFF, ...overrides };
}

describe("TwoFactorCard", () => {
  it("says it is off when nothing is set up", () => {
    render(<TwoFactorCard status={status()} confirmedOn={null} />);

    expect(screen.getByText("Off")).toBeVisible();
    expect(screen.queryByText("Recovery codes left")).toBeNull();
  });

  it("marks an unconfirmed setup as unfinished rather than on", () => {
    render(<TwoFactorCard status={status({ pendingSetup: true })} confirmedOn={null} />);

    expect(screen.getByText("Unfinished")).toBeVisible();
    expect(screen.queryByText("On")).toBeNull();
  });

  it("says a pending setup changes nothing about signing in", () => {
    render(<TwoFactorCard status={status({ pendingSetup: true })} confirmedOn={null} />);

    expect(screen.getByText(/never confirmed it/)).toBeVisible();
  });

  it("shows when it was turned on and how many codes are left", () => {
    render(
      <TwoFactorCard
        status={status({ enabled: true, recoveryCodesRemaining: 7 })}
        confirmedOn="19 Oct 2026, 08:30"
      />,
    );

    expect(screen.getByText("On")).toBeVisible();
    expect(screen.getByText("19 Oct 2026, 08:30")).toBeVisible();
    expect(screen.getByText("7 of 10")).toBeVisible();
  });

  it("leaves the date out when the backend sent none", () => {
    render(
      <TwoFactorCard
        status={status({ enabled: true, recoveryCodesRemaining: 7 })}
        confirmedOn={null}
      />,
    );

    expect(screen.queryByText("Turned on")).toBeNull();
    expect(screen.getByText("7 of 10")).toBeVisible();
  });

  it("stays quiet while there are plenty of codes", () => {
    render(
      <TwoFactorCard
        status={status({ enabled: true, recoveryCodesRemaining: 4 })}
        confirmedOn={null}
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("nudges once the codes are nearly gone", () => {
    render(
      <TwoFactorCard
        status={status({ enabled: true, recoveryCodesRemaining: 3 })}
        confirmedOn={null}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("nearly out of recovery codes");
  });

  it("says plainly when there are none left at all", () => {
    render(
      <TwoFactorCard
        status={status({ enabled: true, recoveryCodesRemaining: 0 })}
        confirmedOn={null}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("no recovery codes left");
  });

  it("nudges nobody who has it switched off", () => {
    render(<TwoFactorCard status={status()} confirmedOn={null} />);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
