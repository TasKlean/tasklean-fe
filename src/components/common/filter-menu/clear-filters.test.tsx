// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClearFilters } from "@/components/common/filter-menu/clear-filters";

const PATH = "/app/groups/g1/overview/activity";

describe("ClearFilters", () => {
  it("draws nothing while nothing is narrowing the list", () => {
    render(<ClearFilters path={PATH} narrowed={false} />);

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("points at the bare path, so the press drops every axis at once", () => {
    render(<ClearFilters path={PATH} narrowed />);

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", PATH);
  });
});
