// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskPager } from "@/components/app/group/board/task-pager/task-pager";

function renderPager(fields: Partial<Parameters<typeof TaskPager>[0]> = {}) {
  render(
    <TaskPager
      page={1}
      totalPages={1}
      totalTasks={3}
      shown={3}
      size={20}
      hrefFor={(page) => `/app/groups/g1?page=${page}`}
      {...fields}
    />,
  );
}

describe("TaskPager", () => {
  it("draws nothing for a board with no tasks on it", () => {
    const { container } = render(
      <TaskPager page={1} totalPages={0} totalTasks={0} shown={0} size={20} hrefFor={() => "/"} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("counts the tasks without paging a single page", () => {
    renderPager();

    expect(screen.getByText("3 tasks")).toBeVisible();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("says task in the singular", () => {
    renderPager({ totalTasks: 1, shown: 1 });

    expect(screen.getByText("1 task")).toBeVisible();
  });

  it("counts from the page it is on, not from the first", () => {
    renderPager({ page: 3, totalPages: 5, totalTasks: 83, shown: 20 });

    expect(screen.getByText("Showing 41 to 60 of 83 tasks")).toBeVisible();
  });

  it("counts the short last page by what it actually holds", () => {
    renderPager({ page: 5, totalPages: 5, totalTasks: 83, shown: 3 });

    expect(screen.getByText("Showing 81 to 83 of 83 tasks")).toBeVisible();
  });

  it("counts by the size the board answered with, not by a number of its own", () => {
    renderPager({ page: 2, totalPages: 3, totalTasks: 25, shown: 10, size: 10 });

    expect(screen.getByText("Showing 11 to 20 of 25 tasks")).toBeVisible();
  });

  it("offers only the way forward on the first page", () => {
    renderPager({ page: 1, totalPages: 5, totalTasks: 83, shown: 20 });

    expect(screen.getByRole("link", { name: "Next" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
  });

  it("offers only the way back on the last page", () => {
    renderPager({ page: 5, totalPages: 5, totalTasks: 83, shown: 3 });

    expect(screen.getByRole("link", { name: "Previous" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
  });

  it("steps one page at a time in each direction", () => {
    renderPager({ page: 3, totalPages: 5, totalTasks: 83, shown: 20 });

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/app/groups/g1?page=2",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/app/groups/g1?page=4",
    );
  });
});
