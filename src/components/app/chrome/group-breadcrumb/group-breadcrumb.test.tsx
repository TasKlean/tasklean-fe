// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app/groups/g1/overview/members");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { GroupBreadcrumb } from "@/components/app/chrome/group-breadcrumb/group-breadcrumb";
import type { MyGroup } from "@/lib/groups/groups.types";

const GROUPS: MyGroup[] = [
  { uid: "g1", name: "Flat 12", myRole: "GROUP_ADMIN" },
  { uid: "g2", name: "Book club", myRole: "GROUP_MEMBER" },
];

beforeEach(() => {
  pathname.mockReturnValue("/app/groups/g1/overview/members");
});

describe("GroupBreadcrumb", () => {
  it("names every level of the open path", () => {
    render(<GroupBreadcrumb groups={GROUPS} />);

    const trail = screen.getByRole("navigation", { name: "Breadcrumb" });

    expect(trail).toBeInTheDocument();
    for (const level of ["My Groups", "Flat 12", "Overview", "Members"]) {
      expect(screen.getByRole("link", { name: level })).toBeInTheDocument();
    }
  });

  it("keeps each crumb's list shut until its own arrow is pressed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GroupBreadcrumb groups={GROUPS} />);

    expect(screen.queryByRole("link", { name: "Book club" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Switch group" }));

    expect(screen.getByRole("link", { name: "Book club" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join a group" })).toBeNull();
  });

  it("offers the two ways in under the list itself", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GroupBreadcrumb groups={GROUPS} />);

    await user.click(screen.getByRole("button", { name: "Add a group" }));

    expect(screen.getByRole("link", { name: "Join a group" })).toBeInTheDocument();
  });

  it("does not link a section with no screen behind it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GroupBreadcrumb groups={GROUPS} />);

    await user.click(screen.getByRole("button", { name: "Switch section" }));

    expect(screen.queryByRole("link", { name: /Audit trail/ })).toBeNull();
    expect(screen.getByText("Audit trail")).toBeInTheDocument();
  });

  it("stops at the group's own page when there is no section", () => {
    pathname.mockReturnValue("/app/groups/g1");
    render(<GroupBreadcrumb groups={GROUPS} />);

    expect(screen.getByRole("link", { name: "Tasks" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Switch section" })).toBeNull();
  });
});
