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
  it("opens the task, which is a URL rather than a press", () => {
    row({});

    expect(screen.getByRole("link", { name: /Mop the floor/ })).toHaveAttribute("href", HREF);
  });

  it("carries the menu whoever is reading, every one of them being able to open it", () => {
    row({}, false);

    expect(screen.getByRole("button", { name: "More for Mop the floor" })).toBeInTheDocument();
  });

  it("dates a task in digits, the column having room for nothing else", () => {
    row({ nextDueDate: "2026-03-11T18:00:00" });

    expect(screen.getByText("11/3")).toBeInTheDocument();
    expect(screen.getAllByText("Due tomorrow").length).toBeGreaterThan(0);
  });

  it("dates one in another year with that year, which a yearly task needs", () => {
    row({ nextDueDate: "2027-01-02T18:00:00" });

    expect(screen.getByText("2/1/27")).toBeInTheDocument();
  });

  it("says a task has to be photographed, which is otherwise only an icon", () => {
    row({ requiresPhotoProof: true });

    expect(screen.getAllByText("Photo proof").length).toBeGreaterThan(0);
  });

  it("says how often a task repeats, which is an icon alone on a phone", () => {
    row({ recurrenceType: "WEEKLY" });

    expect(screen.getAllByText("Every week").length).toBeGreaterThan(0);
  });

  it("says nothing about repeating for a task that does not", () => {
    row({});

    expect(screen.queryByText(/^Every/)).toBeNull();
  });

  it("names what each pill is, the pill itself carrying only the value", () => {
    row({ priority: "HIGH" });

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Assigned to")).toBeInTheDocument();
  });
});
