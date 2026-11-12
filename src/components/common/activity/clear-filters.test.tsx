// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClearFilters } from "@/components/common/activity/clear-filters";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

function renderClear(fields: Partial<AuditFilter> = {}) {
  render(
    <ClearFilters
      path={PATH}
      filter={{ type: null, ref: "", actor: "", from: "", to: "", ...fields }}
    />,
  );
}

describe("ClearFilters", () => {
  it("draws nothing while nothing is narrowing the feed", () => {
    renderClear();

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("goes back to the whole trail, carrying none of the filter with it", () => {
    renderClear({ type: "member", ref: "m2", actor: "u2", from: "2026-11-02", to: "2026-11-09" });

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", PATH);
  });

  it("appears for an axis set on its own, not only for a pinned thing", () => {
    renderClear({ from: "2026-11-02", to: "2026-11-09" });

    expect(screen.getByRole("link", { name: "Clear filters" })).toBeVisible();
  });
});
