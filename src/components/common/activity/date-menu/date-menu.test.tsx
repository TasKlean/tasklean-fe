// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DateMenu } from "@/components/common/activity/date-menu/date-menu";
import { dateChoices } from "@/lib/audit/dates/dates";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

const CHOICES = dateChoices(new Date("2026-11-10T08:00:00Z"), "UTC");

function renderMenu(fields: Partial<AuditFilter> = {}) {
  render(
    <DateMenu
      path={PATH}
      filter={{ type: null, ref: "", actor: "", from: "", to: "", ...fields }}
      choices={CHOICES}
    />,
  );
}

async function open(): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button", { name: /Filter activity by date/ }));
}

async function press(name: string): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button", { name }));
}

describe("DateMenu", () => {
  it("names itself while the feed is the whole trail, and says which to a reader", () => {
    renderMenu();

    expect(
      screen.getByRole("button", { name: "Filter activity by date, showing Any time" }),
    ).toHaveTextContent("Date");
  });

  it("keeps a preset's name when the range is one", () => {
    renderMenu({ from: "2026-11-04", to: "2026-11-10" });

    expect(
      screen.getByRole("button", { name: "Filter activity by date, showing Last 7 days" }),
    ).toBeVisible();
  });

  it("spells out a range of its own", () => {
    renderMenu({ from: "2026-01-05", to: "2026-02-09" });

    expect(
      screen.getByRole("button", {
        name: "Filter activity by date, showing 5 Jan 2026 to 9 Feb 2026",
      }),
    ).toBeVisible();
  });

  it("offers each preset as a link carrying both days", async () => {
    renderMenu();

    await open();

    expect(screen.getByRole("link", { name: "Last 30 days" })).toHaveAttribute(
      "href",
      `${PATH}?from=2026-10-12&to=2026-11-10`,
    );
    expect(screen.getByRole("link", { name: "Any time" })).toHaveAttribute("href", PATH);
  });

  it("keeps the rest of the filter when it sets a range", async () => {
    renderMenu({ type: "member", ref: "m1", actor: "u2" });

    await open();

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute(
      "href",
      `${PATH}?type=member&ref=m1&actor=u2&from=2026-11-10&to=2026-11-10`,
    );
  });

  it("posts the custom range to the same path, with the rest of the filter along", async () => {
    renderMenu({ type: "member", ref: "m1", actor: "u2" });

    await open();
    await press("Choose a custom range");

    const form = screen.getByRole("form", { name: "Custom date range" });

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", PATH);
    expect(form.querySelector('input[name="type"]')).toHaveValue("member");
    expect(form.querySelector('input[name="ref"]')).toHaveValue("m1");
    expect(form.querySelector('input[name="actor"]')).toHaveValue("u2");
  });

  it("opens on the fields when the feed is on a range nobody offered", async () => {
    renderMenu({ from: "2026-11-02", to: "2026-11-09" });

    await open();

    expect(screen.getByLabelText("From")).toHaveValue("2026-11-02");
  });

  it("keeps the fields behind a press until they are asked for", async () => {
    renderMenu();

    await open();

    expect(screen.queryByLabelText("From")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a custom range" })).toBeVisible();
  });

  it("hands focus to the way back, and back to the row that opened the fields", async () => {
    renderMenu();

    await open();
    await press("Choose a custom range");

    expect(screen.getByRole("button", { name: "Back to the date presets" })).toHaveFocus();

    await press("Back to the date presets");

    expect(screen.getByRole("button", { name: "Choose a custom range" })).toHaveFocus();
  });

  it("caps each end of the range by the other, so the refused pair cannot be sent", async () => {
    renderMenu({ from: "2026-11-02", to: "2026-11-09" });

    await open();

    expect(screen.getByLabelText("From")).toHaveAttribute("max", "2026-11-09");
    expect(screen.getByLabelText("To")).toHaveAttribute("min", "2026-11-02");
  });

  it("moves the cap as a date is picked", async () => {
    const user = userEvent.setup({ delay: null });
    renderMenu();

    await open();
    await press("Choose a custom range");
    await user.type(screen.getByLabelText("From"), "2026-11-05");

    expect(screen.getByLabelText("To")).toHaveAttribute("min", "2026-11-05");
  });
});
