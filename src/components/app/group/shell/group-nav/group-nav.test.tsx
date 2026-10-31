// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app/groups/g1");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { GroupNav } from "@/components/app/group/shell/group-nav/group-nav";

const WORKSPACE = [
  ["Tasks", "/app/groups/g1"],
  ["Overview", "/app/groups/g1/overview"],
  ["Group settings", "/app/groups/g1/settings"],
  ["Leave group", "/app/groups/g1/overview/members#leave-group"],
];

const OVERVIEW = [
  ["Back to tasks", "/app/groups/g1"],
  ["Information", "/app/groups/g1/overview/information"],
  ["Members", "/app/groups/g1/overview/members"],
];

const SETTINGS = [
  ["Back to tasks", "/app/groups/g1"],
  ["Preferences", "/app/groups/g1/settings/preferences"],
  ["Notifications", "/app/groups/g1/settings/notifications"],
];

const ADMIN_ONLY = [
  ["Group details", "/app/groups/g1/settings/details"],
  ["Invite code", "/app/groups/g1/settings/invite-code"],
  ["Delete group", "/app/groups/g1/settings/delete"],
];

beforeEach(() => {
  pathname.mockReturnValue("/app/groups/g1");
});

describe("GroupNav", () => {
  it("links the tasks at the group's own path, where opening a group lands", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/app/groups/g1");
  });

  it("marks the open section", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("aria-current", "page");
  });

  it("marks nothing when the open section is not one of its own", () => {
    pathname.mockReturnValue("/app/groups/g1/something-else");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("link", { name: "Tasks" })).not.toHaveAttribute("aria-current");
  });

  it("splits the sections into the daily work and the group's own administration", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("heading", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
  });

  it("offers the sections still being built as dead entries, not links", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.queryByRole("link", { name: /Tags & Categories/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Tags & Categories, coming soon" })).toBeDisabled();
  });

  it("links the sections that are built", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    for (const [label, href] of WORKSPACE) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("sends leaving to the roster, the one screen that knows your membership", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("link", { name: "Leave group" })).toHaveAttribute(
      "href",
      "/app/groups/g1/overview/members#leave-group",
    );
  });

  it("holds one entry per section and nothing else", () => {
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("keeps every entry named once the rail is collapsed", () => {
    render(<GroupNav uid="g1" collapsed admin />);

    for (const [label] of WORKSPACE) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Tags & Categories, coming soon" }),
    ).toBeInTheDocument();
  });

  it("puts the overview's own sections where the workspace sits", () => {
    pathname.mockReturnValue("/app/groups/g1/overview/information");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Workspace" })).toBeNull();
    for (const [label, href] of OVERVIEW) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("calls the settings band the group's, not the account's", () => {
    pathname.mockReturnValue("/app/groups/g1/settings/preferences");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("heading", { name: "Group settings" })).toBeInTheDocument();
  });

  it("says the audit trail is coming rather than linking into nothing", () => {
    pathname.mockReturnValue("/app/groups/g1/overview/information");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("button", { name: "Audit trail, coming soon" })).toBeDisabled();
  });

  it("marks the open sub-section, not the area it sits in", () => {
    pathname.mockReturnValue("/app/groups/g1/overview/members");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("puts the settings sections where the workspace sits", () => {
    pathname.mockReturnValue("/app/groups/g1/settings/preferences");
    render(<GroupNav uid="g1" collapsed={false} admin />);

    expect(screen.getByRole("heading", { name: "Group settings" })).toBeInTheDocument();
    for (const [label, href] of [...SETTINGS, ...ADMIN_ONLY]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("offers a member only the settings that are theirs", () => {
    pathname.mockReturnValue("/app/groups/g1/settings/preferences");
    render(<GroupNav uid="g1" collapsed={false} admin={false} />);

    for (const [label, href] of SETTINGS) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    for (const [label] of ADMIN_ONLY) {
      expect(screen.queryByRole("link", { name: label })).toBeNull();
    }
  });
});
