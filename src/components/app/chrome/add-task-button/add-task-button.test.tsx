// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const path = vi.fn(() => "/app/groups/g1");
const search = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => path(),
  useSearchParams: () => search(),
}));

import { AddTaskButton } from "@/components/app/chrome/add-task-button/add-task-button";

describe("AddTaskButton", () => {
  it("opens the form over the board, keeping the filter it is read under", () => {
    search.mockReturnValueOnce(new URLSearchParams("priority=high&page=2"));
    render(<AddTaskButton />);

    expect(screen.getByRole("link", { name: "Add task" })).toHaveAttribute(
      "href",
      "/app/groups/g1?priority=high&page=2&task=new",
    );
  });

  it("goes to the board from a group's other screens, the form living there", () => {
    path.mockReturnValueOnce("/app/groups/g1/overview/members");
    search.mockReturnValueOnce(new URLSearchParams("type=MEMBER_ADDED"));
    render(<AddTaskButton />);

    expect(screen.getByRole("link", { name: "Add task" })).toHaveAttribute(
      "href",
      "/app/groups/g1?task=new",
    );
  });

  it("is drawn nowhere but inside a group, a chore having none to belong to", () => {
    path.mockReturnValueOnce("/app/settings/profile");
    render(<AddTaskButton />);

    expect(screen.queryByRole("link", { name: "Add task" })).toBeNull();
  });
});
