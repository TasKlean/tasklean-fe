// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsNav } from "@/components/app/settings-nav/settings-nav";

const { pathname } = vi.hoisted(() => ({ pathname: { value: "/app/settings" } }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

describe("SettingsNav", () => {
  it("lists every section", () => {
    pathname.value = "/app/settings";
    render(<SettingsNav />);

    expect(screen.getByRole("link", { name: "Devices and sessions" })).toHaveAttribute(
      "href",
      "/app/settings/devices",
    );
  });

  it("marks nothing as open on the index", () => {
    pathname.value = "/app/settings";
    render(<SettingsNav />);

    expect(screen.getByRole("link", { name: "Devices and sessions" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the open section", () => {
    pathname.value = "/app/settings/devices";
    render(<SettingsNav />);

    expect(screen.getByRole("link", { name: "Devices and sessions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps the section marked on a page below it", () => {
    pathname.value = "/app/settings/devices/42";
    render(<SettingsNav />);

    expect(screen.getByRole("link", { name: "Devices and sessions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
