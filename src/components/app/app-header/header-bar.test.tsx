// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.fn(() => "/app");

vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

import { HeaderBar } from "@/components/app/app-header/header-bar";

beforeEach(() => {
  pathname.mockReturnValue("/app");
});

describe("HeaderBar", () => {
  it("keeps the header inside the page's column where there is no rail", () => {
    render(
      <HeaderBar>
        <span>chrome</span>
      </HeaderBar>,
    );

    expect(screen.getByText("chrome").parentElement).toHaveClass("max-w-app");
  });

  it("spans the window on a group's own screens, where the rail starts at its edge", () => {
    pathname.mockReturnValue("/app/groups/g1/members");
    render(
      <HeaderBar>
        <span>chrome</span>
      </HeaderBar>,
    );

    expect(screen.getByText("chrome").parentElement).not.toHaveClass("max-w-app");
  });

  it("keeps the column on the screens that create and join a group", () => {
    pathname.mockReturnValue("/app/groups/new");
    render(
      <HeaderBar>
        <span>chrome</span>
      </HeaderBar>,
    );

    expect(screen.getByText("chrome").parentElement).toHaveClass("max-w-app");
  });
});
