// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupAvatar } from "@/components/app/group-avatar/group-avatar";

describe("GroupAvatar", () => {
  it("draws the group's picture when it has one", () => {
    render(<GroupAvatar name="Flat 12" photoUrl="https://img.test/flat.png" />);

    const image = screen.getByRole("presentation");
    expect(image).toHaveAttribute("src", "https://img.test/flat.png");
  });

  it("stands in with the first letter of the name", () => {
    render(<GroupAvatar name="flat 12" />);

    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in rather than pointing an image at a link it cannot trust", () => {
    render(<GroupAvatar name="Flat 12" photoUrl="javascript:alert(1)" />);

    expect(screen.queryByRole("presentation")).toBeNull();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in for a name that is nothing but space", () => {
    render(<GroupAvatar name="   " />);

    expect(screen.queryByRole("presentation")).toBeNull();
  });
});
