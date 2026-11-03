// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GroupName } from "@/components/app/group/shell/group-sidebar/group-name";

const LONG = "The flat on Oakwood Avenue that the four of us share";

describe("GroupName", () => {
  it("shows the name on one line until it is pressed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GroupName name={LONG} />);

    const press = screen.getByRole("button", { name: LONG });
    expect(press).toHaveClass("truncate");
    expect(press).toHaveAttribute("aria-expanded", "false");

    await user.click(press);

    expect(press).not.toHaveClass("truncate");
    expect(press).toHaveAttribute("aria-expanded", "true");
  });

  it("goes back to one line on a second press", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GroupName name={LONG} />);

    const press = screen.getByRole("button", { name: LONG });
    await user.click(press);
    await user.click(press);

    expect(press).toHaveClass("truncate");
    expect(press).toHaveAttribute("aria-expanded", "false");
  });
});
