// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { InfoTip } from "@/components/common/info-tip/info-tip";

const TEXT = "It needs a due date.";

describe("InfoTip", () => {
  it("is named after the field it explains", () => {
    render(<InfoTip label="Repeats" text={TEXT} />);

    expect(screen.getByRole("button", { name: "About Repeats" })).toBeInTheDocument();
  });

  it("describes the press with its words, open or not", () => {
    render(<InfoTip label="Repeats" text={TEXT} />);

    expect(screen.getByRole("button")).toHaveAccessibleDescription(TEXT);
  });

  it("opens on a press, a touch screen having no hover to go on", async () => {
    const user = userEvent.setup();
    render(<InfoTip label="Repeats" text={TEXT} />);
    const press = screen.getByRole("button");

    expect(press).toHaveAttribute("aria-expanded", "false");

    await user.click(press);

    expect(press).toHaveAttribute("aria-expanded", "true");
  });

  it("does not toggle the control of the label it sits inside", async () => {
    const user = userEvent.setup();
    render(
      <label>
        Require photo proof
        <input type="checkbox" />
        <InfoTip label="Require photo proof" text={TEXT} />
      </label>,
    );

    await user.click(screen.getByRole("button", { name: "About Require photo proof" }));

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
});
