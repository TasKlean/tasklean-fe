// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupAvatar } from "@/components/common/group-avatar/group-avatar";

function picture(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>("[style*='background-image']");
}

describe("GroupAvatar", () => {
  it("reads the picture through our own route, never from the bucket", () => {
    const { container } = render(<GroupAvatar name="Flat 12" photoUid="up-1" size="list" />);

    expect(picture(container)?.style.backgroundImage).toContain("/api/image/up-1");
  });

  it("stands in with the first letter of the name", () => {
    render(<GroupAvatar name="flat 12" size="list" />);

    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in for a group with no picture", () => {
    const { container } = render(<GroupAvatar name="Flat 12" photoUid="" size="list" />);

    expect(picture(container)).toBeNull();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("stands in for a name that is nothing but space", () => {
    const { container } = render(<GroupAvatar name="   " size="list" />);

    expect(picture(container)).toBeNull();
  });

  it("keeps the letter under a picture, so a read that fails needs no handler", () => {
    const { container } = render(<GroupAvatar name="Flat 12" photoUid="up-1" size="list" />);

    expect(picture(container)).toBeInTheDocument();
    expect(screen.getByText("F")).toHaveAttribute("aria-hidden", "true");
  });
});
