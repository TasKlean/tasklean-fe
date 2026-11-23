// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { SidePanel } from "@/components/common/side-panel/side-panel";

const CLOSE = "/app/groups/g1?priority=high";

function panel(dismissable = false) {
  return render(
    <>
      <button type="button">Behind</button>

      <SidePanel
        label="Mop the floor"
        close={{ href: CLOSE }}
        dismissable={dismissable}
        header={<span>Task details</span>}
      >
        <button type="button">First</button>
        <button type="button">Last</button>
      </SidePanel>
    </>,
  );
}

beforeEach(() => {
  push.mockClear();
});

describe("SidePanel", () => {
  it("is named by its own heading, so the string is written once", () => {
    panel();

    expect(screen.getByRole("dialog", { name: "Mop the floor" })).toBeVisible();
  });

  it("is not modal, since nothing behind it is dimmed", () => {
    panel();

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });

  it("leaves the page behind it usable, scroll included", () => {
    panel();

    expect(document.body.style.overflow).toBe("");
  });

  it("takes focus itself, so the panel is announced before its first control", () => {
    panel();

    expect(screen.getByRole("dialog", { name: "Mop the floor" })).toHaveFocus();
  });

  it("closes on Escape, keeping the board's filter", async () => {
    panel(true);
    await userEvent.keyboard("{Escape}");

    expect(push).toHaveBeenCalledExactlyOnceWith(CLOSE);
  });

  it("stays open on Escape where dismissal was not asked for, the key closing the picker inside it", async () => {
    panel();
    await userEvent.keyboard("{Escape}");

    expect(push).not.toHaveBeenCalled();
  });

  it("closes on a press outside, where the caller asks for it", async () => {
    panel(true);
    await userEvent.click(screen.getByRole("button", { name: "Behind" }));

    expect(push).toHaveBeenCalledExactlyOnceWith(CLOSE);
  });

  it("stays open on a press inside it", async () => {
    panel(true);
    await userEvent.click(screen.getByRole("button", { name: "First" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("stays open on a press outside where it was not asked for, since a form may be half typed", async () => {
    panel();
    await userEvent.click(screen.getByRole("button", { name: "Behind" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("names the way out once, not twice over", () => {
    panel();

    expect(screen.getAllByRole("link", { name: "Close" })).toHaveLength(1);
  });
});
