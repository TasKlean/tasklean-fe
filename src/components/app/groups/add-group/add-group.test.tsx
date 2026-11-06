// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddGroup } from "@/components/app/groups/add-group/add-group";

describe("AddGroup", () => {
  it("offers the only two ways into a group", () => {
    render(<AddGroup layout="stacked" />);

    expect(screen.getByRole("link", { name: "Create a group" })).toHaveAttribute(
      "href",
      "/app/groups/new",
    );
    expect(screen.getByRole("link", { name: "Join with a code" })).toHaveAttribute(
      "href",
      "/app/groups/join",
    );
  });
});
