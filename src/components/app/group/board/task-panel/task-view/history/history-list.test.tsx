// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryList } from "@/components/app/group/board/task-panel/task-view/history/history-list";
import type { RoundPage, RoundPageResult } from "@/lib/tasks/completions/completions.types";

const loadMore = vi.fn<(fields: { cursor: string }) => Promise<RoundPageResult>>();

const NOW = new Date("2026-03-10T11:00:00Z");

const ZONE = "Europe/Ljubljana";

const TASK_HREF = "/app/groups/g1?task=t1&sort=newest";

const FIRST: RoundPage = {
  rounds: [
    {
      id: 9,
      outcome: "DONE",
      dateCompleted: "2026-03-10T09:30:00",
      dueDate: "2026-03-09T22:59:00",
      minutes: 30,
      attributedTo: { memberUid: "m2", name: "Maja", lastName: "Novak" },
    },
    { id: 8, outcome: "SKIPPED", dateCompleted: "2026-03-03T09:30:00" },
  ],
  nextCursor: "c2",
  total: 3,
};

function list(first: RoundPage = FIRST) {
  return render(
    <HistoryList
      loadMore={loadMore}
      first={first}
      taskHref={TASK_HREF}
      now={NOW}
      timeZone={ZONE}
    />,
  );
}

beforeEach(() => {
  loadMore.mockReset();
});

describe("HistoryList", () => {
  it("hangs each round off the task's own link, so one can be sent", () => {
    list();

    expect(screen.getByRole("link", { name: /Done/ })).toHaveAttribute(
      "href",
      `${TASK_HREF}&round=9`,
    );
  });

  it("appends the page the cursor names and keeps what was there", async () => {
    loadMore.mockResolvedValue({
      ok: true,
      page: { rounds: [{ id: 7, outcome: "DONE" }], nextCursor: null, total: 3 },
    });

    list();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(loadMore).toHaveBeenCalledWith({ cursor: "c2" });
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("reports a refused page above the press, keeping the rounds on screen", async () => {
    loadMore.mockResolvedValue({ ok: false, message: "That page cannot be loaded." });

    list();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That page cannot be loaded.");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("draws nothing at all for a task nobody has recorded", () => {
    list({ rounds: [], nextCursor: null, total: 0 });

    expect(screen.queryByRole("heading", { name: /Completion history/ })).toBeNull();
  });

  it("names the round a row was recorded against, and who recorded it", () => {
    list();

    expect(screen.getByRole("link", { name: /Done/ })).toHaveAccessibleName(
      /for 9 Mar.*Maja Novak/,
    );
    expect(screen.getByText("Maja Novak")).toBeInTheDocument();
  });

  it("offers no press where the first page is the whole history", () => {
    list({ rounds: FIRST.rounds, nextCursor: null, total: 2 });

    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    expect(screen.getByText("2 of 2 rounds")).toBeInTheDocument();
  });
});
