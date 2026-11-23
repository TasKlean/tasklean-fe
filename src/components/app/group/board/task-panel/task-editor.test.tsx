// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  savedUid: string | null;
  fieldErrors?: Record<string, string>;
  values?: unknown;
};

const createTaskAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
  savedUid: "t9",
}));

const updateTaskAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(async () => ({
  error: null,
  savedUid: "t1",
}));

const deleteTaskAction = vi.fn<(group: string, task: string) => Promise<{ error: string | null }>>(
  async () => ({ error: null }),
);

const createTaskTagAction = vi.fn<
  (
    group: string,
    name: string,
    color: string,
  ) => Promise<{ name: string | null; error: string | null }>
>(async (_group, name) => ({ name, error: null }));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  createTaskAction: (previous: unknown, data: FormData) => createTaskAction(previous, data),
  updateTaskAction: (previous: unknown, data: FormData) => updateTaskAction(previous, data),
  deleteTaskAction: (group: string, task: string) => deleteTaskAction(group, task),
  createTaskTagAction: (group: string, name: string, color: string) =>
    createTaskTagAction(group, name, color),
}));

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/app/(app)/uploads/actions/actions", () => ({ requestUploadAction: vi.fn() }));

import { TaskEditor } from "@/components/app/group/board/task-panel/task-editor";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import { taskValues } from "@/lib/tasks/write/write";
import type { TaskValues } from "@/lib/validation/forms/task.schema/task.schema";

const ZONE = "Europe/Ljubljana";

const MEMBERS = [
  { memberUid: "m1", name: "Maja Novak", former: false, self: true },
  { memberUid: "m2", name: "Dan Kos", former: false, self: false },
  { memberUid: "m3", name: "Ana Horvat", former: true, self: false },
];

const CATEGORIES = [{ id: 3, name: "Kitchen", color: "#43aa8b" }];
const TAGS = [{ id: 9, name: "weekly", color: "#4d96ff" }];

const onSaved = vi.fn();
const onDiscard = vi.fn();

function editor(overrides: Partial<Parameters<typeof TaskEditor>[0]> = {}) {
  return render(
    <TaskEditor
      mode="create"
      groupUid="g1"
      values={taskValues(null, ZONE)}
      photoUid={null}
      categories={CATEGORIES}
      tags={TAGS}
      members={MEMBERS}
      byline={null}
      closeHref="/app/groups/g1"
      onDiscard={onDiscard}
      onSaved={onSaved}
      {...overrides}
    />,
  );
}

function posted(call: ReturnType<typeof vi.fn>): Record<string, string[]> {
  const data = call.mock.calls[0][1] as FormData;
  const fields: Record<string, string[]> = {};
  for (const [name, value] of data.entries()) {
    fields[name] = [...(fields[name] ?? []), String(value)];
  }
  return fields;
}

beforeEach(() => {
  createTaskAction.mockClear();
  updateTaskAction.mockClear();
  deleteTaskAction.mockClear();
  createTaskTagAction.mockClear();
  onSaved.mockClear();
  onDiscard.mockClear();
});

describe("TaskEditor", () => {
  it("leaves the panel on Cancel while creating, there being nothing to go back to", () => {
    editor();

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/app/groups/g1");
  });

  it("puts the facts back on Cancel while editing, which is the panel's own state", async () => {
    const user = userEvent.setup();
    editor({ mode: "edit", taskUid: "t1" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onDiscard).toHaveBeenCalled();
  });

  it("names itself a new chore rather than an edit of one", () => {
    editor();

    expect(screen.getByRole("heading", { name: "New task" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Create task" })).toHaveLength(2);
    // Nothing to discard back to, the facts behind the form being the chore's.
    expect(screen.queryByRole("button", { name: "Discard" })).toBeNull();
  });

  it("starts a new chore empty, with no priority on it", () => {
    editor();

    expect(screen.getByLabelText(/^Task title/)).toHaveValue("");
    expect(screen.getByRole("radio", { name: "Medium" })).not.toBeChecked();
  });

  it("clears the priority on a second press, a radio having no way back off", async () => {
    const user = userEvent.setup();
    editor();
    await user.click(screen.getByRole("radio", { name: "High" }));
    await user.click(screen.getByRole("radio", { name: "High" }));

    expect(screen.getByRole("radio", { name: "High" })).not.toBeChecked();
  });

  it("will not create a chore with no name", async () => {
    editor();
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(createTaskAction).not.toHaveBeenCalled();
    expect(screen.getByText("Name this chore.")).toBeVisible();
  });

  it("creates a chore, naming the group it belongs to", async () => {
    editor();
    await userEvent.type(screen.getByLabelText(/^Task title/), "Mop the floor");
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(posted(createTaskAction)).toMatchObject({
      groupUid: ["g1"],
      name: ["Mop the floor"],
    });
    expect(posted(createTaskAction).priority).toBeUndefined();
  });

  it("posts every field on a save, because the endpoint replaces the whole chore", async () => {
    const values: TaskValues = {
      name: "Mop the floor",
      description: "Kitchen and hall",
      priority: "HIGH",
      categoryId: "3",
      tagNames: ["weekly"],
      assignedToUid: "m2",
      dueDate: "2026-01-15",
      dueTime: "09:00",
      recurrenceType: "WEEKLY",
      estimatedTimeMinutes: "30",
      requiresPhotoProof: true,
    };

    editor({ mode: "edit", taskUid: "t1", values, photoUid: "upload-1" });
    await userEvent.click(screen.getAllByRole("button", { name: "Save changes" })[1]);

    expect(posted(updateTaskAction)).toEqual({
      groupUid: ["g1"],
      taskUid: ["t1"],
      photoUid: ["upload-1"],
      name: ["Mop the floor"],
      description: ["Kitchen and hall"],
      priority: ["HIGH"],
      categoryId: ["3"],
      tagNames: ["weekly"],
      assignedToUid: ["m2"],
      dueDate: ["2026-01-15"],
      dueTime: ["09:00"],
      recurrenceType: ["WEEKLY"],
      estimatedTimeMinutes: ["30"],
      requiresPhotoProof: ["on"],
    });
  });

  it("refuses a repeating chore with no date, which the endpoint answers 400 with no code", async () => {
    editor({ values: { ...taskValues(null, ZONE), name: "Bins", recurrenceType: "WEEKLY" } });
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(createTaskAction).not.toHaveBeenCalled();
    expect(screen.getByText("A chore that repeats needs a date to repeat from.")).toBeVisible();
  });

  it("tells the panel which chore it saved, so the facts can come back", async () => {
    editor({ values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("t9"));
  });

  it("saves from the header too, the press sitting outside the form", async () => {
    editor({ mode: "edit", taskUid: "t1", values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]);

    await waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
  });

  it("offers nobody who has left, since a chore cannot be given to them", async () => {
    editor();
    await userEvent.click(screen.getByRole("combobox", { name: "Who this chore is for" }));

    expect(screen.getByRole("option", { name: "Dan Kos" })).toBeVisible();
    expect(screen.queryByRole("option", { name: /Ana Horvat/ })).toBeNull();
  });

  it("offers the reader by name, carrying their membership rather than a token", async () => {
    editor();
    await userEvent.click(screen.getByRole("combobox", { name: "Who this chore is for" }));
    await userEvent.click(screen.getByRole("option", { name: "Me (Maja Novak)" }));
    await userEvent.type(screen.getByLabelText(/^Task title/), "Mop the floor");
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(posted(createTaskAction).assignedToUid).toEqual(["m1"]);
  });

  it("attaches a tag the household already has without making another", async () => {
    editor({ values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await userEvent.click(screen.getByRole("button", { name: /weekly/ }));
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(createTaskTagAction).not.toHaveBeenCalled();
    expect(posted(createTaskAction).tagNames).toEqual(["weekly"]);
  });

  it("makes a new tag with its colour before the chore carries it", async () => {
    editor({ values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await userEvent.type(screen.getByLabelText("Tag name"), "downstairs");
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));

    await waitFor(() =>
      expect(createTaskTagAction).toHaveBeenCalledWith("g1", "downstairs", DEFAULT_SWATCH),
    );
  });

  it("posts a stretch picked off the presses", async () => {
    editor({ values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getByRole("button", { name: "45m" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    expect(posted(createTaskAction).estimatedTimeMinutes).toEqual(["45"]);
  });

  it("asks before deleting a chore, which nothing brings back", async () => {
    editor({ mode: "edit", taskUid: "t1", values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(deleteTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }));

    await waitFor(() => expect(deleteTaskAction).toHaveBeenCalledWith("g1", "t1"));
  });

  it("offers no delete while creating, there being nothing to delete", () => {
    editor();

    expect(screen.queryByRole("button", { name: "Delete task" })).toBeNull();
  });

  it("reports a refused save where it was pressed", async () => {
    updateTaskAction.mockResolvedValueOnce({
      error: "This chore is not yours to change. Its author or an admin can.",
      savedUid: null,
    });

    editor({ mode: "edit", taskUid: "t1", values: { ...taskValues(null, ZONE), name: "Bins" } });
    await userEvent.click(screen.getAllByRole("button", { name: "Save changes" })[1]);

    expect(await screen.findByRole("alert")).toHaveTextContent("not yours to change");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
