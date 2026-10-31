// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddGroup } from "@/components/app/groups/add-group/add-group";

describe("AddGroup", () => {
  it("offers the only two ways into a group", () => {
    render(<AddGroup layout="stacked" />);

    expect(screen.getByRole("link", { name: "Create a group" })).toHaveAttribute(
      "href",
      "/app/groups/new",
    );
    expect(screen.getByRole("link", { name: "Join with a code" })).toHaveAttribute(
      "href",
      "/app/groups/join",
    );
  });

  it("offers the same two links whichever layout it is asked for", () => {
    render(<AddGroup layout="inline" />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("leaves the narrow screens to the bar, in either layout", () => {
    const { container } = render(<AddGroup layout="inline" />);
    const inline = container.firstElementChild;

    const stacked = render(<AddGroup layout="stacked" />).container.firstElementChild;

    for (const row of [inline, stacked]) {
      expect(row).toHaveClass("hidden");
      expect(row).toHaveClass("lg:flex");
    }
  });
});
