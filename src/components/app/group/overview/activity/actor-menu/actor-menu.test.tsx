// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActorMenu } from "@/components/app/group/overview/activity/actor-menu/actor-menu";
import type { ActorChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const PATH = "/app/groups/g1/overview/activity";

const ACTORS: ActorChoice[] = [
  { ref: "u1", name: "Alice Johnson", former: false },
  { ref: "u2", name: "Dan Novak", former: false },
];

function renderMenu(fields: Partial<AuditFilter> = {}, actors: ActorChoice[] = ACTORS) {
  render(
    <ActorMenu
      path={PATH}
      filter={{ type: null, ref: "", actor: "", from: "", to: "", ...fields }}
      actors={actors}
    />,
  );
}

async function open(): Promise<void> {
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button"));
}

describe("ActorMenu", () => {
  it("reads as anybody's actions until one person is named", () => {
    renderMenu();

    expect(
      screen.getByRole("button", { name: "Filter activity by who acted, showing Anyone" }),
    ).toBeVisible();
  });

  it("names the person whose actions the feed shows", () => {
    renderMenu({ actor: "u2" });

    expect(
      screen.getByRole("button", { name: "Filter activity by who acted, showing Dan Novak" }),
    ).toBeVisible();
  });

  it("says on the closed pill that the name on it is whose actions these are", () => {
    renderMenu({ actor: "u2" });

    expect(screen.getByRole("button")).toHaveTextContent("Actor: Dan Novak");
  });

  it("falls back to anybody for an actor the roster cannot name", () => {
    renderMenu({ actor: "u9" });

    expect(
      screen.getByRole("button", { name: "Filter activity by who acted, showing Anyone" }),
    ).toBeVisible();
  });

  it("says which of the people offered are no longer in the group", async () => {
    renderMenu({}, [...ACTORS, { ref: "u3", name: "Nina Kos", former: true }]);

    await open();

    expect(screen.getByRole("link", { name: "Nina Kos, no longer in the group" })).toBeVisible();
  });

  it("heads the people who have left with one divider, however many there are", async () => {
    renderMenu({}, [
      ...ACTORS,
      { ref: "u3", name: "Nina Kos", former: true },
      { ref: "u4", name: "Jure Zupan", former: true },
    ]);

    await open();

    expect(screen.getAllByText("Left the group")).toHaveLength(1);
  });

  it("heads nothing when everybody offered is still in the group", async () => {
    renderMenu();

    await open();

    expect(screen.queryByText("Left the group")).toBeNull();
  });

  it("asks for one person's actions by their user uid, not their membership", async () => {
    renderMenu();

    await open();

    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute(
      "href",
      `${PATH}?actor=u2`,
    );
  });

  it("keeps the rest of the filter when it changes who acted", async () => {
    renderMenu({ type: "member", ref: "m1" });

    await open();

    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute(
      "href",
      `${PATH}?type=member&ref=m1&actor=u2`,
    );
  });

  it("goes back to anybody's actions without dropping the kind", async () => {
    renderMenu({ type: "task", actor: "u2" });

    await open();
    const anyone = screen.getByRole("link", { name: "Anyone" });

    expect(anyone).toHaveAttribute("href", `${PATH}?type=task`);
    expect(screen.getByRole("link", { name: "Dan Novak" })).toHaveAttribute("aria-current", "page");
  });

  it("marks nobody but the person that is on", async () => {
    renderMenu({ actor: "u2" });

    await open();

    expect(screen.getByRole("link", { name: "Anyone" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Alice Johnson" })).not.toHaveAttribute("aria-current");
  });
});
