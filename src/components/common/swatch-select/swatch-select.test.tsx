// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SwatchSelect } from "@/components/common/swatch-select/swatch-select";
import type { SwatchOption } from "@/components/common/swatch-select/swatch-select.types";

const OPTIONS: readonly SwatchOption[] = [
  { value: "a", label: "Red", content: <span /> },
  { value: "b", label: "Teal", content: <span /> },
  { value: "c", label: "Blue", content: <span /> },
];

function setup(value = "a", onChange = vi.fn()) {
  render(
    <SwatchSelect
      name="color"
      label="Colour"
      value={value}
      options={OPTIONS}
      fallback={<span />}
      onChange={onChange}
    />,
  );

  return onChange;
}

describe("SwatchSelect", () => {
  it("names the choice on the closed trigger, which shows no text of its own", () => {
    setup("b");

    expect(screen.getByRole("combobox", { name: "Colour: Teal" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("names a stored value none of the options holds by the value itself", () => {
    setup("#123456");

    expect(screen.getByRole("combobox", { name: "Colour: #123456" })).toBeInTheDocument();
  });

  it("posts the value through a hidden input, so the form needs no handler", () => {
    setup("b");

    expect(document.querySelector('input[name="color"]')).toHaveValue("b");
  });

  it("shows nothing until pressed, then names every option", async () => {
    setup();

    expect(screen.queryByRole("listbox")).toBeNull();
    await userEvent.click(screen.getByRole("combobox", { name: "Colour: Red" }));

    for (const option of OPTIONS) {
      expect(screen.getByRole("option", { name: option.label })).toBeInTheDocument();
    }
  });

  it("takes a choice and closes", async () => {
    const onChange = setup();

    await userEvent.click(screen.getByRole("combobox", { name: "Colour: Red" }));
    await userEvent.click(screen.getByRole("option", { name: "Blue" }));

    expect(onChange).toHaveBeenCalledWith("c");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("marks the stored option as the selected one", async () => {
    setup("b");

    await userEvent.click(screen.getByRole("combobox", { name: "Colour: Teal" }));

    expect(screen.getByRole("option", { name: "Teal" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Red" })).toHaveAttribute("aria-selected", "false");
  });

  it("opens on an arrow key and commits on Enter, keeping focus on the button", async () => {
    const onChange = setup();

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{ArrowRight}{Enter}");

    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("closes on Escape without taking a choice", async () => {
    const onChange = setup();

    await userEvent.click(screen.getByRole("combobox", { name: "Colour: Red" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
