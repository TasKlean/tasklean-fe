// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { GroupSwitcher } from "@/components/app/chrome/group-switcher/group-switcher";

const GROUPS = [
  { uid: "g1", name: "Flat 12" },
  { uid: "g2", name: "Lake house" },
];

beforeEach(() => {
  pathname.mockReturnValue("/app");
});

describe("GroupSwitcher", () => {
  it("renders nothing for an account with no groups", () => {
    render(<GroupSwitcher groups={[]} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("reads Groups where no group is open, and points at the list", () => {
    render(<GroupSwitcher groups={GROUPS} />);

    expect(screen.getByRole("link", { name: "Groups" })).toHaveAttribute("href", "/app");
  });

  it("names the group the path is inside, and points back into it", () => {
    pathname.mockReturnValue("/app/groups/g2");
    render(<GroupSwitcher groups={GROUPS} />);

    expect(screen.getByRole("link", { name: "Lake house" })).toHaveAttribute(
      "href",
      "/app/groups/g2",
    );
  });

  it("keeps reading Groups on the create screen, which is not a group", () => {
    pathname.mockReturnValue("/app/groups/new");
    render(<GroupSwitcher groups={GROUPS} />);

    expect(screen.getByRole("link", { name: "Groups" })).toBeInTheDocument();
  });

  it("leaves the list closed until the arrow is pressed", () => {
    render(<GroupSwitcher groups={GROUPS} />);

    expect(screen.getByRole("button", { name: "Switch group" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("offers every group and a way to create one", async () => {
    const user = userEvent.setup();
    render(<GroupSwitcher groups={GROUPS} />);

    await user.click(screen.getByRole("button", { name: "Switch group" }));

    expect(screen.getByRole("link", { name: "Flat 12" })).toHaveAttribute("href", "/app/groups/g1");
    expect(screen.getByRole("link", { name: "Lake house" })).toHaveAttribute(
      "href",
      "/app/groups/g2",
    );
    expect(screen.getByRole("link", { name: "Create a group" })).toHaveAttribute(
      "href",
      "/app/groups/new",
    );
  });

  it("marks the open group in the list", async () => {
    pathname.mockReturnValue("/app/groups/g1/members");
    const user = userEvent.setup();
    render(<GroupSwitcher groups={GROUPS} />);

    await user.click(screen.getByRole("button", { name: "Switch group" }));
    const list = within(screen.getByRole("list"));

    expect(list.getByRole("link", { name: "Flat 12" })).toHaveAttribute("aria-current", "page");
    expect(list.getByRole("link", { name: "Lake house" })).not.toHaveAttribute("aria-current");
  });

  it("closes once a group is chosen", async () => {
    const user = userEvent.setup();
    render(<GroupSwitcher groups={GROUPS} />);

    await user.click(screen.getByRole("button", { name: "Switch group" }));
    await user.click(screen.getByRole("link", { name: "Flat 12" }));

    expect(screen.queryByRole("link", { name: "Create a group" })).toBeNull();
  });

  it("names a group the backend sent without one", async () => {
    const user = userEvent.setup();
    render(<GroupSwitcher groups={[{ uid: "g3" }]} />);

    await user.click(screen.getByRole("button", { name: "Switch group" }));

    expect(screen.getByRole("link", { name: "Untitled group" })).toBeInTheDocument();
  });
});
