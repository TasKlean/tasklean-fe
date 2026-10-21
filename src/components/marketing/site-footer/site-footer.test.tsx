// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/marketing/site-footer/site-footer";

describe("SiteFooter", () => {
  it("invites a visitor to sign up", () => {
    render(<SiteFooter signedIn={false} name={null} />);

    expect(screen.getByRole("link", { name: "Create an account" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go to app" })).toBeNull();
  });

  it("points a signed-in visitor at the app", () => {
    render(<SiteFooter signedIn name="Bob" />);

    expect(screen.getByRole("link", { name: "Go to app" })).toHaveAttribute("href", "/app");
    expect(screen.getByText(/Hello,/)).toHaveTextContent("Hello, Bob");
    expect(screen.queryByRole("link", { name: "Create an account" })).toBeNull();
  });
});
