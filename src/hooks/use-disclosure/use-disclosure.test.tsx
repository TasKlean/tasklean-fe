// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

function Popup() {
  const { open, toggle, close, root, trigger } = useDisclosure();

  return (
    <div>
      <div ref={root}>
        <button ref={trigger} type="button" aria-expanded={open} onClick={toggle}>
          Open it
        </button>
        {open ? (
          <div>
            <button type="button">Inside</button>
            <button type="button" onClick={close}>
              Close it
            </button>
          </div>
        ) : null}
      </div>
      <button type="button">Outside</button>
    </div>
  );
}

describe("useDisclosure", () => {
  it("starts closed and opens on a press", async () => {
    const user = userEvent.setup();
    render(<Popup />);

    expect(screen.queryByRole("button", { name: "Inside" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open it" }));

    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open it" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes on a press outside the wrapper", async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(screen.getByRole("button", { name: "Open it" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("button", { name: "Inside" })).toBeNull();
  });

  it("stays open for a press inside it", async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(screen.getByRole("button", { name: "Open it" }));
    await user.click(screen.getByRole("button", { name: "Inside" }));

    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
  });

  it("closes on escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<Popup />);
    const trigger = screen.getByRole("button", { name: "Open it" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("button", { name: "Inside" })).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes when asked directly", async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(screen.getByRole("button", { name: "Open it" }));
    await user.click(screen.getByRole("button", { name: "Close it" }));

    expect(screen.queryByRole("button", { name: "Inside" })).toBeNull();
  });
});
