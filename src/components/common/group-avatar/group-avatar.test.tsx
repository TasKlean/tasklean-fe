// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupAvatar } from "@/components/common/group-avatar/group-avatar";

describe("GroupAvatar", () => {
  it("reads the picture through our own route, never from the bucket", () => {
    render(<GroupAvatar name="Flat 12" photoUid="up-1" />);

    expect(screen.getByRole("presentation")).toHaveAttribute("src", "/api/image/up-1");
  });

  it("stands in with the first letter of the name", () => {
    render(<GroupAvatar name="flat 12" />);

    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in for a group with no picture", () => {
    render(<GroupAvatar name="Flat 12" photoUid="" />);

    expect(screen.queryByRole("presentation")).toBeNull();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in for a name that is nothing but space", () => {
    render(<GroupAvatar name="   " />);

    expect(screen.queryByRole("presentation")).toBeNull();
  });
});
