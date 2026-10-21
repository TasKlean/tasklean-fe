// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaskedEmail } from "@/components/common/masked-email/masked-email";
import { ringHalves } from "@/components/common/masked-email/ring-halves";

const EMAIL = "ada.lovelace@example.com";

afterEach(() => {
  vi.useRealTimers();
});

function renderMasked() {
  render(<MaskedEmail email={EMAIL} />);
  return screen.getByRole("button");
}

describe("MaskedEmail at rest", () => {
  it("does not show the address", () => {
    renderMasked();

    expect(screen.queryByText(EMAIL)).toBeNull();
  });

  it("tells a screen reader what is hidden and how to see it", () => {
    renderMasked();

    expect(screen.getByText(/Email address hidden/)).toBeInTheDocument();
  });

  it("does not publish the address length", () => {
    const button = renderMasked();

    expect(button.textContent).not.toContain("•".repeat(EMAIL.length));
  });
});

describe("MaskedEmail on a press", () => {
  it("reveals immediately, since a press is already deliberate", async () => {
    const user = userEvent.setup();
    const button = renderMasked();

    await user.click(button);

    expect(screen.getByText(EMAIL)).toBeInTheDocument();
  });

  it("hides again on a second press", async () => {
    const user = userEvent.setup();
    const button = renderMasked();

    await user.click(button);
    await user.click(button);

    expect(screen.queryByText(EMAIL)).toBeNull();
  });
});

describe("MaskedEmail on hover", () => {
  it("stays hidden before the hold is up", () => {
    vi.useFakeTimers();
    const button = renderMasked();

    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1200));

    expect(screen.queryByText(EMAIL)).toBeNull();
  });

  it("reveals once the hold completes", () => {
    vi.useFakeTimers();
    const button = renderMasked();

    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1500));

    expect(screen.getByText(EMAIL)).toBeInTheDocument();
  });

  it("abandons the hold when the pointer leaves", () => {
    vi.useFakeTimers();
    const button = renderMasked();

    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.pointerLeave(button);
    act(() => vi.advanceTimersByTime(1500));

    expect(screen.queryByText(EMAIL)).toBeNull();
  });

  it("ignores a touch, which has no hover to speak of", () => {
    vi.useFakeTimers();
    const button = renderMasked();

    fireEvent.pointerEnter(button, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByText(EMAIL)).toBeNull();
  });
});

describe("ringHalves", () => {
  it("starts both halves at the bottom centre", () => {
    const [right, left] = ringHalves({ width: 200, height: 40, radius: 12 });

    expect(right.startsWith("M 100 40")).toBe(true);
    expect(left.startsWith("M 100 40")).toBe(true);
  });

  it("ends both halves at the top centre, so they meet", () => {
    const [right, left] = ringHalves({ width: 200, height: 40, radius: 12 });

    expect(right.endsWith("H 100")).toBe(true);
    expect(left.endsWith("H 100")).toBe(true);
  });

  it("sends one half right and the other left", () => {
    const [right, left] = ringHalves({ width: 200, height: 40, radius: 12 });

    expect(right).toContain("H 188");
    expect(left).toContain("H 12");
  });

  it("clamps the radius on an element shorter than it", () => {
    const [right] = ringHalves({ width: 200, height: 10, radius: 12 });

    expect(right).toContain("A 5 5");
  });
});
