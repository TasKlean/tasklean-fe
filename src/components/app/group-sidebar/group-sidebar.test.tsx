// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app/groups/g1");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { GroupSidebar } from "@/components/app/group-sidebar/group-sidebar";

const GROUP = {
  uid: "g1",
  name: "Flat 12",
  photoUrl: null,
  description: "Everything the four of us share",
  memberCount: 4,
  admin: true,
};

beforeEach(() => {
  pathname.mockReturnValue("/app/groups/g1");
});

describe("GroupSidebar", () => {
  it("names the group as the page's one heading", () => {
    render(<GroupSidebar {...GROUP} />);

    expect(screen.getByRole("heading", { level: 1, name: "Flat 12" })).toBeInTheDocument();
  });

  it("says what the group is for and where the reader stands in it", () => {
    render(<GroupSidebar {...GROUP} />);

    expect(screen.getByText(GROUP.description)).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(/4 members\. You are an admin\./)).toBeInTheDocument();
  });

  it("calls a member a member", () => {
    render(<GroupSidebar {...GROUP} admin={false} />);

    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText(/You are a member\./)).toBeInTheDocument();
  });

  it("leaves out the lines the backend sent nothing for", () => {
    render(<GroupSidebar {...GROUP} description={null} memberCount={null} />);

    expect(screen.queryByText(GROUP.description)).toBeNull();
    expect(screen.getByText(/You are an admin\./)).toBeInTheDocument();
  });

  it("holds the group's sections", () => {
    render(<GroupSidebar {...GROUP} />);

    expect(screen.getByRole("navigation", { name: "Group sections" })).toBeInTheDocument();
  });

  it("offers a collapse control that then offers the way back", async () => {
    const user = userEvent.setup();
    render(<GroupSidebar {...GROUP} />);

    await user.click(screen.getByRole("button", { name: "Collapse the sidebar" }));

    expect(screen.getByRole("button", { name: "Expand the sidebar" })).toBeInTheDocument();
  });

  it("keeps the group's name and its sections once collapsed", async () => {
    const user = userEvent.setup();
    render(<GroupSidebar {...GROUP} />);

    await user.click(screen.getByRole("button", { name: "Collapse the sidebar" }));

    expect(screen.getByRole("heading", { level: 1, name: "Flat 12" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
  });
});
