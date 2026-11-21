// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { TaskSearch } from "@/components/app/group/board/task-search/task-search";
import { DEFAULT_STATES } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

const PATH = "/app/groups/g1";

function query(overrides: Partial<TaskQuery> = {}): TaskQuery {
  return {
    q: "",
    status: DEFAULT_STATES,
    who: { kind: "anyone" },
    categoryId: null,
    tagId: null,
    priority: [],
    overdue: false,
    sort: "due-asc",
    page: 1,
    ...overrides,
  };
}

afterEach(() => {
  replace.mockClear();
});

describe("TaskSearch", () => {
  it("submits to the board as a GET, so it works with no JavaScript", () => {
    const { container } = render(<TaskSearch path={PATH} query={query()} />);
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("action", PATH);
    expect(form).toHaveAttribute("method", "get");
  });

  it("carries the rest of the filter, so searching does not drop it", () => {
    const { container } = render(
      <TaskSearch path={PATH} query={query({ status: ["done"], priority: ["high", "low"] })} />,
    );

    const hidden = [...container.querySelectorAll("input[type=hidden]")].map((field) => [
      field.getAttribute("name"),
      field.getAttribute("value"),
    ]);

    expect(hidden).toEqual([
      ["status", "done"],
      ["priority", "high"],
      ["priority", "low"],
    ]);
  });

  it("posts the box under the name the URL reads it from", () => {
    render(<TaskSearch path={PATH} query={query({ q: "floor" })} />);

    expect(screen.getByRole("searchbox", { name: "Search chores" })).toHaveAttribute("name", "q");
  });

  it("stops typing at the length the backend refuses past", () => {
    render(<TaskSearch path={PATH} query={query()} />);

    expect(screen.getByRole("searchbox")).toHaveAttribute("maxlength", "100");
  });

  it("offers no way to clear an empty box", () => {
    render(<TaskSearch path={PATH} query={query()} />);

    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("keeps every keystroke, where a native submit would reload the page and undo them", async () => {
    render(<TaskSearch path={PATH} query={query()} />);
    const box = screen.getByRole("searchbox");

    await userEvent.type(box, "mop");

    expect(box).toHaveValue("mop");
  });

  it("replaces the URL rather than navigating the document, a beat after typing stops", async () => {
    render(<TaskSearch path={PATH} query={query()} />);
    await userEvent.type(screen.getByRole("searchbox"), "mop");

    await waitFor(
      () => expect(replace).toHaveBeenCalledExactlyOnceWith(`${PATH}?q=mop`, { scroll: false }),
      { timeout: 2000 },
    );
  });

  it("sends the reader back to the first page, since page four may not survive the search", async () => {
    render(<TaskSearch path={PATH} query={query({ page: 4 })} />);
    await userEvent.type(screen.getByRole("searchbox"), "mop");

    await waitFor(
      () => expect(replace).toHaveBeenCalledExactlyOnceWith(`${PATH}?q=mop`, { scroll: false }),
      { timeout: 2000 },
    );
  });

  it("pushes once for a burst of typing, not once per keystroke", async () => {
    render(<TaskSearch path={PATH} query={query()} />);
    await userEvent.type(screen.getByRole("searchbox"), "kitchen");

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(replace).toHaveBeenCalledWith(`${PATH}?q=kitchen`, { scroll: false });
  });
});
