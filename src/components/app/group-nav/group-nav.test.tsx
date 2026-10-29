// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app/groups/g1");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { GroupNav } from "@/components/app/group-nav/group-nav";

const DEAD = ["Tasks", "Tags & Categories", "Members", "Settings", "Leave group"];

beforeEach(() => {
  pathname.mockReturnValue("/app/groups/g1");
});

describe("GroupNav", () => {
  it("links the overview at the group's own path", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/app/groups/g1",
    );
  });

  it("marks the open section", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });

  it("marks nothing when the open section is not one of its own", () => {
    pathname.mockReturnValue("/app/groups/g1/something-else");
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("splits the sections into the daily work and the group's own administration", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getByRole("heading", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
  });

  it("offers the sections still being built as dead entries, not links", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    for (const label of DEAD) {
      expect(screen.queryByRole("link", { name: new RegExp(label) })).toBeNull();
      expect(screen.getByRole("button", { name: `${label}, coming soon` })).toBeDisabled();
    }
  });

  it("offers no route for leaving, which is an action and not a screen", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getByRole("button", { name: "Leave group, coming soon" })).not.toHaveAttribute(
      "href",
    );
  });

  it("holds one entry per section and nothing else", () => {
    render(<GroupNav uid="g1" collapsed={false} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("keeps every entry named once the rail is collapsed", () => {
    render(<GroupNav uid="g1" collapsed />);

    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    for (const label of DEAD) {
      expect(screen.getByRole("button", { name: `${label}, coming soon` })).toBeInTheDocument();
    }
  });
});
