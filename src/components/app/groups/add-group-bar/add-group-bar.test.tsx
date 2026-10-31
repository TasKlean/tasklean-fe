// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddGroupBar } from "@/components/app/groups/add-group-bar/add-group-bar";

describe("AddGroupBar", () => {
  it("links to the two pages a group is reached through", () => {
    render(<AddGroupBar />);

    expect(screen.getByRole("link", { name: "Create group" })).toHaveAttribute(
      "href",
      "/app/groups/new",
    );
    expect(screen.getByRole("link", { name: "Join with code" })).toHaveAttribute(
      "href",
      "/app/groups/join",
    );
  });

  it("gives each half the same share of the bar", () => {
    render(<AddGroupBar />);

    for (const half of screen.getAllByRole("link")) {
      expect(half).toHaveClass("flex-1");
    }
  });

  it("stays off a screen wide enough for the buttons in the page", () => {
    const { container } = render(<AddGroupBar />);

    expect(container.firstElementChild).toHaveClass("lg:hidden");
  });
});
