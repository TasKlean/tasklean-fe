// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditPage } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type Result = { ok: true; page: AuditPage } | { ok: false; message: string };

const loadActivityPageAction = vi.fn<(fields: unknown) => Promise<Result>>();

vi.mock("@/app/(app)/app/groups/[uid]/overview/activity/actions/actions", () => ({
  loadActivityPageAction: (fields: unknown) => loadActivityPageAction(fields),
}));

import { ActivityFeed } from "@/components/app/group/overview/activity/activity-feed";

const NOW = new Date("2026-11-06T12:00:00Z");

const FIRST: AuditPage = {
  entries: [
    {
      uid: "a1",
      action: "CREATE",
      entity: { type: "TASK" },
      actor: { uid: "u2", name: "Alice", lastName: "Johnson" },
      dateCreated: "2026-11-06T11:00:00",
    },
  ],
  nextCursor: "c1",
  total: 3,
};

function page(entries: AuditPage["entries"], nextCursor: string | null): AuditPage {
  return { entries, nextCursor, total: 3 };
}

function renderFeed(filter: AuditFilter = { type: null, ref: "" }) {
  render(
    <ActivityFeed
      groupUid="g1"
      first={FIRST}
      viewerUid="u1"
      now={NOW}
      filter={filter}
      heading={<h2>Activity</h2>}
    >
      <p>Filters</p>
    </ActivityFeed>,
  );
}

beforeEach(() => {
  loadActivityPageAction.mockReset();
});

describe("ActivityFeed", () => {
  it("appends the next page and counts what is on screen against the total", async () => {
    const user = userEvent.setup({ delay: null });
    loadActivityPageAction.mockResolvedValue({
      ok: true,
      page: page(
        [{ uid: "a2", action: "UPDATE", entity: { type: "GROUP" }, actor: { uid: "u1" } }],
        "c2",
      ),
    });

    renderFeed();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson added a task")).toBeInTheDocument();
    expect(screen.getByText("You updated the group")).toBeInTheDocument();
  });

  it("carries the cursor the last page handed back, not the first one", async () => {
    const user = userEvent.setup({ delay: null });
    loadActivityPageAction.mockResolvedValue({ ok: true, page: page([{ uid: "a2" }], "c2") });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(loadActivityPageAction).toHaveBeenNthCalledWith(1, { groupUid: "g1", cursor: "c1" });
    expect(loadActivityPageAction).toHaveBeenNthCalledWith(2, { groupUid: "g1", cursor: "c2" });
  });

  it("drops the button once the backend hands back no cursor", async () => {
    const user = userEvent.setup({ delay: null });
    loadActivityPageAction.mockResolvedValue({
      ok: true,
      // The last page of three, so nothing is left to ask for and the count
      // stops counting progress.
      page: page([{ uid: "a2" }, { uid: "a3" }], null),
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("3 entries")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("pages a filtered feed under the same filter the cursor was issued for", async () => {
    const user = userEvent.setup({ delay: null });
    loadActivityPageAction.mockResolvedValue({ ok: true, page: page([{ uid: "a2" }], null) });

    renderFeed({ type: "member", ref: "m1" });
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(loadActivityPageAction).toHaveBeenCalledWith({
      groupUid: "g1",
      cursor: "c1",
      type: "member",
      ref: "m1",
    });
  });

  it("keeps the rows it has when a page is refused, and says so", async () => {
    const user = userEvent.setup({ delay: null });
    loadActivityPageAction.mockResolvedValue({
      ok: false,
      message: "We could not reach TasKlean.",
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not reach TasKlean.");
    expect(screen.getByText("Alice Johnson added a task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });
});
