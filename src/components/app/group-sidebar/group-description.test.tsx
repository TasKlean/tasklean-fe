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
    render(<GroupDescription description={SHORT} away="" />);

    expect(screen.getByText(SHORT)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clamps a long one and offers the rest", () => {
    render(<GroupDescription description={LONG} away="" />);

    expect(screen.getByText(LONG)).toHaveClass("line-clamp-3");
    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("gives the whole description on a press, and takes it back", async () => {
    const user = userEvent.setup();
    render(<GroupDescription description={LONG} away="" />);

    await user.click(screen.getByRole("button", { name: "Read more" }));

    expect(screen.getByText(LONG)).not.toHaveClass("line-clamp-3");

    await user.click(screen.getByRole("button", { name: "Show less" }));

    expect(screen.getByText(LONG)).toHaveClass("line-clamp-3");
  });

  it("goes away with the rest of the card when the rail collapses", () => {
    const { container } = render(<GroupDescription description={LONG} away="lg:hidden" />);

    expect(container.firstElementChild).toHaveClass("lg:hidden");
  });
});
