// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip } from "@/components/common/tooltip/tooltip";

describe("Tooltip", () => {
  it("names the thing under it", () => {
    render(
      <Tooltip text="Category">
        <span>Kitchen</span>
      </Tooltip>,
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("keeps its words out of the accessible name of whatever wraps it", () => {
    render(
      <a href="/app">
        <Tooltip text="Category">
          <span>Kitchen</span>
        </Tooltip>
      </a>,
    );

    expect(screen.getByRole("link")).toHaveAccessibleName("Kitchen");
  });
});
