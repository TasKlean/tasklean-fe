// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  deleteTaskAction: vi.fn(),
}));

import { TaskRow } from "@/components/app/group/board/task-row/task-row";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

const ZONE = "Europe/Ljubljana";
const NOW = new Date("2026-03-10T09:00:00Z");
const HREF = "/app/groups/g1?task=t1";
const EDIT = "/app/groups/g1?task=t1&edit=1";

function row(task: Partial<Task>, canEdit = true) {
  return render(
    <ul>
      <TaskRow
        task={{ uid: "t1", name: "Mop the floor", status: "TODO", ...task }}
        category={undefined}
        href={HREF}
        editHref={EDIT}
        groupUid="g1"
        canEdit={canEdit}
        now={NOW}
        timeZone={ZONE}
      />
    </ul>,
  );
}

describe("TaskRow", () => {
  it("opens the chore, which is a URL rather than a press", () => {
    row({});

    expect(screen.getByRole("link", { name: /Mop the floor/ })).toHaveAttribute("href", HREF);
  });

  it("carries the menu whoever is reading, every one of them being able to open it", () => {
    row({}, false);

    expect(screen.getByRole("button", { name: "More for Mop the floor" })).toBeInTheDocument();
  });

  it("dates a chore in digits, the column having room for nothing else", () => {
    row({ nextDueDate: "2026-03-11T18:00:00" });

    expect(screen.getByTitle("Due tomorrow")).toHaveTextContent("11/3");
  });

  it("dates one in another year with that year, which a yearly chore needs", () => {
    row({ nextDueDate: "2027-01-02T18:00:00" });

    expect(screen.getByTitle("Due 2 Jan")).toHaveTextContent("2/1/27");
  });

  it("says a chore has to be photographed, which is otherwise only an icon", () => {
    row({ requiresPhotoProof: true });

    expect(screen.getAllByTitle("Photo proof").length).toBeGreaterThan(0);
  });

  it("says how often a chore repeats, which is an icon alone on a phone", () => {
    row({ recurrenceType: "WEEKLY" });

    expect(screen.getAllByTitle("Every week").length).toBeGreaterThan(0);
  });

  it("says nothing about repeating for a chore that does not", () => {
    row({});

    expect(screen.queryByTitle(/^Every/)).toBeNull();
  });
});
