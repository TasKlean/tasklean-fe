// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/marketing/site-header";

describe("SiteHeader signed out", () => {
  it("offers the ways in", () => {
    render(<SiteHeader signedIn={false} name={null} />);

    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go to app" })).toBeNull();
  });
});

describe("SiteHeader signed in", () => {
  it("points at the app instead", () => {
    render(<SiteHeader signedIn name="Bob" />);

    expect(screen.getByRole("link", { name: "Go to app" })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Get started" })).toBeNull();
  });

  it("greets by name", () => {
    render(<SiteHeader signedIn name="Bob" />);

    expect(screen.getByText(/Hello,/)).toHaveTextContent("Hello, Bob");
  });

  it("drops the greeting when the session carries no name", () => {
    render(<SiteHeader signedIn name={null} />);

    expect(screen.queryByText(/Hello,/)).toBeNull();
    expect(screen.getByRole("link", { name: "Go to app" })).toBeInTheDocument();
  });
});
