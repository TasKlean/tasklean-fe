// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupPreferences } from "@/components/app/group-settings/group-preferences";

describe("GroupPreferences", () => {
  it("offers every layout, and none of them yet", () => {
    render(<GroupPreferences />);

    for (const label of ["List", "Cards", "Calendar"]) {
      expect(screen.getByRole("button", { name: `${label}, coming soon` })).toBeDisabled();
    }
  });

  it("shows which layout a group reads as until then", () => {
    render(<GroupPreferences />);

    expect(screen.getByRole("button", { name: "List, coming soon" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("says why nothing can be chosen", () => {
    render(<GroupPreferences />);

    expect(screen.getByText(/Coming soon, once there are tasks to show/)).toBeInTheDocument();
  });
});
