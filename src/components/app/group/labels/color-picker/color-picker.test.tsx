// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker } from "@/components/app/group/labels/color-picker/color-picker";
import { SWATCHES } from "@/lib/labels/palette/palette";

describe("ColorPicker", () => {
  it("names the stored colour however its case was stored", () => {
    render(<ColorPicker value="#43AA8B" onChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Colour: Teal" })).toBeInTheDocument();
  });

  it("offers the whole palette and nothing else", async () => {
    render(<ColorPicker value={SWATCHES[0].value} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option")).toHaveLength(SWATCHES.length);
  });
});
