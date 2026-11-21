// @vitest-environment jsdom

import { Tags } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavEntry } from "@/components/app/group/shell/group-nav/nav-entry";

describe("NavEntry", () => {
  it("links a section that is built", () => {
    render(<NavEntry item={{ label: "Labels", icon: Tags, href: "/x" }} open={false} shape="" />);

    expect(screen.getByRole("link", { name: "Labels" })).toHaveAttribute("href", "/x");
  });

  it("names a section that is not built yet in full, since a collapsed rail hides the chip", () => {
    render(
      <NavEntry
        item={{ label: "Share", icon: Tags, href: "/x", soon: true }}
        open={false}
        shape=""
      />,
    );

    expect(screen.getByRole("button", { name: "Share, coming soon" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /Share/ })).toBeNull();
  });

  it("refuses to link an entry with nowhere to point", () => {
    render(<NavEntry item={{ label: "Leave group", icon: Tags }} open={false} shape="" />);

    expect(screen.getByRole("button", { name: "Leave group, coming soon" })).toBeDisabled();
  });
});
