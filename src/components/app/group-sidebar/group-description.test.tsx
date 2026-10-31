// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GroupDescription } from "@/components/app/group-sidebar/group-description";

const SHORT = "Everything the four of us share.";

const LONG = "Everything the four of us share in the flat, from the kitchen rota to the bins. "
  .repeat(3)
  .trim();

describe("GroupDescription", () => {
  it("shows a short description with nothing to press", () => {
    render(<GroupDescription description={SHORT} shown="flex" />);

    expect(screen.getByText(SHORT)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clamps a long one and says there is more", () => {
    render(<GroupDescription description={LONG} shown="flex" />);

    expect(screen.getByText(LONG)).toHaveClass("line-clamp-3");
    expect(screen.getByText("Read more")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("gives the whole description on a press of the text, and takes it back", async () => {
    const user = userEvent.setup();
    render(<GroupDescription description={LONG} shown="flex" />);

    await user.click(screen.getByText(LONG));

    expect(screen.getByText(LONG)).not.toHaveClass("line-clamp-3");
    expect(screen.getByText("Show less")).toBeInTheDocument();

    await user.click(screen.getByText(LONG));

    expect(screen.getByText(LONG)).toHaveClass("line-clamp-3");
  });
});
