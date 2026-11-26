// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabelChip } from "@/components/common/label-chip/label-chip";

describe("LabelChip", () => {
  it("leads a tag with a hash nobody has to hear", () => {
    render(<LabelChip name="weekly" kind="tag" />);

    expect(screen.getByText("#")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("weekly")).toBeVisible();
  });

  it("draws a category's icon where a tag draws the hash", () => {
    render(<LabelChip name="Kitchen" icon={<span data-testid="icon" />} />);

    expect(screen.getByTestId("icon")).toBeVisible();
    expect(screen.queryByText("#")).toBeNull();
  });
});
