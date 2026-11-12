// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityFeed } from "@/components/common/activity/activity-feed";
import type { AuditNames, AuditPage, AuditPageLoader } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

const loadMore = vi.fn<AuditPageLoader>();

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

const UPDATED: AuditPage = {
  entries: [
    {
      uid: "a9",
      action: "UPDATE",
      entity: { type: "TASK" },
      actor: { uid: "u1" },
      changedFields: [
        { field: "name" },
        { field: "description" },
        { field: "priority", from: "LOW", to: "HIGH" },
        { field: "status", from: "PENDING", to: "IN_PROGRESS" },
        { field: "icon", to: "broom" },
      ],
      dateCreated: "2026-11-06T11:00:00",
    },
  ],
  nextCursor: null,
  total: 1,
};

const ROLE_CHANGED: AuditPage = {
  entries: [
    {
      uid: "a8",
      action: "ROLE_CHANGED",
      entity: { type: "GROUP_MEMBER", ref: "m2" },
      actor: { uid: "u2", name: "Alice", lastName: "Johnson" },
      changedFields: [{ field: "role", from: "GROUP_MEMBER", to: "GROUP_ADMIN" }],
      dateCreated: "2026-11-06T11:00:00",
    },
  ],
  nextCursor: null,
  total: 1,
};

const TWO_DAYS: AuditPage = {
  entries: [
    { uid: "a1", action: "CREATE", entity: { type: "TASK" }, dateCreated: "2026-11-06T11:00:00" },
    { uid: "a2", action: "CREATE", entity: { type: "TAG" }, dateCreated: "2026-11-05T09:30:00" },
    { uid: "a3", action: "CREATE", entity: { type: "TAG" }, dateCreated: "2026-11-01T08:15:00" },
  ],
  nextCursor: null,
  total: 3,
};

function renderFeed(
  filter: Partial<AuditFilter> = {},
  first: AuditPage = FIRST,
  names: AuditNames = {},
) {
  const whole: AuditFilter = { type: null, ref: "", actor: "", from: "", to: "", ...filter };

  render(
    <ActivityFeed
      loadMore={loadMore}
      first={first}
      viewerUid="u1"
      now={NOW}
      filter={whole}
      names={names}
      timeZone="UTC"
      heading={<h2>Activity</h2>}
      menu={<p>Filters</p>}
      dates={<p>Any time</p>}
      clear={null}
    />,
  );
}

function whole(text: string, selector: string): HTMLElement {
  return screen.getByText((_content, element) => element?.textContent === text, { selector });
}

function said(text: string): HTMLElement {
  return whole(text, "p");
}

function detail(text: string): HTMLElement {
  return whole(text, "li");
}

beforeEach(() => {
  loadMore.mockReset();
});

describe("ActivityFeed", () => {
  it("counts what is on screen against the total, at the foot of the list", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      page: page(
        [{ uid: "a2", action: "UPDATE", entity: { type: "GROUP" }, actor: { uid: "u1" } }],
        "c2",
      ),
      names: {},
    });

    renderFeed();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("2 of 3")).toBeInTheDocument();
    expect(said("Alice Johnson added a task")).toBeInTheDocument();
    expect(said("You updated the group")).toBeInTheDocument();
  });

  it("carries the cursor the last page handed back, not the first one", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      page: page([{ uid: "a2" }], "c2"),
      names: {},
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(loadMore).toHaveBeenNthCalledWith(1, { cursor: "c1" });
    expect(loadMore).toHaveBeenNthCalledWith(2, { cursor: "c2" });
  });

  it("drops the button once the backend hands back no cursor", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      // The last page of three, so nothing is left to ask for and the count
      // stops counting progress.
      page: page([{ uid: "a2" }, { uid: "a3" }], null),
      names: {},
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("3 entries")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("keeps what an update moved behind a press, counted in the label", () => {
    renderFeed({ type: null, ref: "" }, UPDATED);

    expect(screen.getByRole("button", { name: "Show 5 changes" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Name changed")).toBeNull();
  });

  it("says what each field an update moved went from and to, once asked", async () => {
    const user = userEvent.setup({ delay: null });
    renderFeed({ type: null, ref: "" }, UPDATED);

    await user.click(screen.getByRole("button", { name: "Show 5 changes" }));

    expect(detail("Priority changed from Low to High")).toBeInTheDocument();
    expect(detail("Status changed from Pending to In progress")).toBeInTheDocument();
    expect(detail("Icon set to broom")).toBeInTheDocument();
    expect(detail("Name changed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide changes" })).toBeInTheDocument();
  });

  it("names the member a row is about when the page resolved one", () => {
    renderFeed({ type: null, ref: "" }, ROLE_CHANGED, { m2: { name: "Dan Novak" } });

    expect(said("Alice Johnson changed Dan Novak's role from Member to Admin")).toBeInTheDocument();
  });

  it("names a member only the page it appended had a row about", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      page: page(ROLE_CHANGED.entries, null),
      names: { m2: { name: "Dan Novak" } },
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(said("Alice Johnson changed Dan Novak's role from Member to Admin")).toBeVisible();
  });

  it("names the kind instead for a member the roster could not name", () => {
    renderFeed({ type: null, ref: "" }, ROLE_CHANGED);

    expect(said("Alice Johnson changed a member's role from Member to Admin")).toBeInTheDocument();
  });

  it("cuts the rows into the days they happened on", () => {
    renderFeed({ type: null, ref: "" }, TWO_DAYS);

    expect(screen.getByRole("heading", { level: 3, name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Yesterday" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "1 Nov 2026" })).toBeInTheDocument();
  });

  it("has nothing to press on a row whose line already said what changed", () => {
    renderFeed({ type: null, ref: "" }, ROLE_CHANGED, { m2: { name: "Dan Novak" } });

    expect(screen.queryByRole("button", { name: /change/ })).toBeNull();
  });

  it("runs the rows together and dates each one once the headings are hidden", async () => {
    const user = userEvent.setup({ delay: null });
    renderFeed({ type: null, ref: "" }, TWO_DAYS);

    await user.click(screen.getByRole("button", { name: "Ungroup by date" }));

    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.getByText("1 Nov")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("draws the clock in the zone the server read, not the runtime's", () => {
    renderFeed({ type: null, ref: "" }, TWO_DAYS);

    expect(screen.getByText("11:00")).toBeInTheDocument();
  });

  it("pages an actor's feed under the same actor the cursor was issued for", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      page: page([{ uid: "a2" }], null),
      names: {},
    });

    renderFeed({ actor: "u2" });
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(loadMore).toHaveBeenCalledWith({
      cursor: "c1",
      type: undefined,
      ref: undefined,
      actor: "u2",
    });
  });

  it("pages a filtered feed under the same filter the cursor was issued for", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: true,
      page: page([{ uid: "a2" }], null),
      names: {},
    });

    renderFeed({ type: "member", ref: "m1" });
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(loadMore).toHaveBeenCalledWith({
      cursor: "c1",
      type: "member",
      ref: "m1",
    });
  });

  it("keeps the rows it has when a page is refused, and says so", async () => {
    const user = userEvent.setup({ delay: null });
    loadMore.mockResolvedValue({
      ok: false,
      message: "We could not reach TasKlean.",
    });

    renderFeed();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not reach TasKlean.");
    expect(said("Alice Johnson added a task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });
});
