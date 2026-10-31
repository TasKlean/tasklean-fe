// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupSection } from "@/components/app/group-section/group-section";

describe("GroupSection", () => {
  it("renders a card per group under the heading", () => {
    render(
      <GroupSection
        title="Groups you manage"
        groups={[
          { uid: "g1", name: "Flat 12" },
          { uid: "g2", name: "Lake house" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Groups you manage" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders nothing at all when it holds no groups, heading included", () => {
    render(<GroupSection title="Groups you manage" groups={[]} />);

    expect(screen.queryByRole("heading", { name: "Groups you manage" })).not.toBeInTheDocument();
  });
});
