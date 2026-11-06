// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddGroupBar } from "@/components/app/groups/add-group-bar/add-group-bar";

describe("AddGroupBar", () => {
  it("links to the two pages a group is reached through", () => {
    render(<AddGroupBar />);

    expect(screen.getByRole("link", { name: "Create group" })).toHaveAttribute(
      "href",
      "/app/groups/new",
    );
    expect(screen.getByRole("link", { name: "Join with code" })).toHaveAttribute(
      "href",
      "/app/groups/join",
    );
  });
});
