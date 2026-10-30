// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/app",
}));

import { GroupFilters } from "@/components/app/group-filters/group-filters";
import type { GroupQuery } from "@/lib/groups/filter/filter.types";

const BASE: GroupQuery = { q: "", show: ["admin", "member"], sort: "name-asc" };

const SETTLED = 400;

function box(): HTMLElement {
  return screen.getByRole("searchbox", { name: "Search groups" });
}

beforeEach(() => {
  replace.mockClear();
});

describe("GroupFilters", () => {
  it("pushes a search once typing stops, and not before", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={BASE} />);

    await user.type(box(), "flat");

    expect(replace).not.toHaveBeenCalled();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app?q=flat", { scroll: false }));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("drops the query string entirely when the search is cleared", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={{ ...BASE, q: "flat" }} />);

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app", { scroll: false }));
  });

  it("starts with both sides on", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={BASE} />);

    await user.click(screen.getByRole("button", { name: "Show" }));

    for (const side of ["Groups you manage", "Groups you're in"]) {
      expect(screen.getByRole("checkbox", { name: side })).toBeChecked();
    }
  });

  it("unticks one side into the URL, carrying what was typed", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={BASE} />);

    await user.type(box(), "fla");
    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.click(screen.getByRole("checkbox", { name: "Groups you manage" }));

    expect(replace).toHaveBeenCalledWith("/app?q=fla&show=member", { scroll: false });
  });

  it("will not let the last side go, and says why", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={{ ...BASE, show: ["admin"] }} />);

    await user.click(screen.getByRole("button", { name: "Show, Groups you manage only" }));

    expect(screen.getByRole("checkbox", { name: "Groups you manage" })).toBeDisabled();
    expect(screen.getByText("One side has to stay on.")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Groups you manage" }));

    expect(replace).not.toHaveBeenCalled();
  });

  it("puts a side back, which leaves nothing in the URL", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={{ ...BASE, show: ["admin"] }} />);

    await user.click(screen.getByRole("button", { name: "Show, Groups you manage only" }));
    await user.click(screen.getByRole("checkbox", { name: "Groups you're in" }));

    expect(replace).toHaveBeenCalledWith("/app", { scroll: false });
  });

  it("names the order it is in, and sets another one", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={BASE} />);

    await user.click(screen.getByRole("button", { name: "Sort by Name A to Z" }));
    await user.click(screen.getByRole("button", { name: "Most members" }));

    expect(replace).toHaveBeenCalledWith("/app?sort=members-desc", { scroll: false });
    expect(screen.queryByRole("button", { name: "Most members" })).toBeNull();
  });

  it("leaves the default order out of the URL", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={{ ...BASE, sort: "members-desc" }} />);

    await user.click(screen.getByRole("button", { name: "Sort by Most members" }));
    await user.click(screen.getByRole("button", { name: "Name A to Z" }));

    expect(replace).toHaveBeenCalledWith("/app", { scroll: false });
  });

  it("switches panels when the other one is open", async () => {
    const user = userEvent.setup();
    render(<GroupFilters query={BASE} />);

    await user.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByRole("checkbox", { name: "Groups you manage" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sort by Name A to Z" }));

    expect(screen.queryByRole("checkbox", { name: "Groups you manage" })).toBeNull();
    expect(screen.getByRole("button", { name: "Most members" })).toBeInTheDocument();
  });

  it("takes the box back when the URL changes underneath it, without pushing again", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<GroupFilters query={{ ...BASE, q: "flat" }} />);

    await user.clear(box());
    await user.type(box(), "beach");
    rerender(<GroupFilters query={BASE} />);

    expect(box()).toHaveValue("");

    await new Promise((resolve) => setTimeout(resolve, SETTLED));
    expect(replace).not.toHaveBeenCalled();
  });
});
