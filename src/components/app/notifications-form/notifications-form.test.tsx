// @vitest-environment jsdom

import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationMatrix } from "@/lib/notifications/settings/settings.types";

type State = { error: string | null; settings?: NotificationMatrix; done?: boolean };

const saveNotificationsAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>();

vi.mock("@/app/(app)/app/settings/notifications/actions/actions", () => ({
  saveNotificationsAction: (previous: unknown, data: FormData) =>
    saveNotificationsAction(previous, data),
}));

import { NotificationsForm } from "@/components/app/notifications-form/notifications-form";

const SAVED: NotificationMatrix = {
  TASK_ASSIGNED: { inApp: true, email: true },
  TASK_COMPLETED: { inApp: true, email: false },
  TASK_REMINDER: { inApp: false, email: false },
  MEMBER_JOINED: { inApp: true, email: true },
};

const SILENT_IN_APP: NotificationMatrix = {
  TASK_ASSIGNED: { inApp: false, email: true },
  TASK_COMPLETED: { inApp: false, email: false },
  TASK_REMINDER: { inApp: false, email: false },
  MEMBER_JOINED: { inApp: false, email: true },
};

const REMINDER_IN_APP = "Task reminders, in app";

const held: Array<(state: State) => void> = [];

beforeEach(() => {
  held.length = 0;
  saveNotificationsAction.mockReset();
  saveNotificationsAction.mockImplementation(async () => ({
    error: null,
    settings: SAVED,
    done: true,
  }));
});

function hold() {
  saveNotificationsAction.mockImplementation(
    () => new Promise<State>((resolve) => held.push(resolve)),
  );
}

async function settle(state: State) {
  const resolve = held.shift();
  await act(async () => resolve?.(state));
}

function save() {
  return screen.getByRole("button", { name: /Save changes/ });
}

describe("NotificationsForm", () => {
  it("offers a switch for every type and channel", () => {
    render(<NotificationsForm settings={SAVED} />);

    expect(screen.getAllByRole("switch")).toHaveLength(10);
  });

  it("shows what the account has saved", () => {
    render(<NotificationsForm settings={SAVED} />);

    expect(screen.getByRole("switch", { name: "Task completed, in app" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Task completed, email" })).not.toBeChecked();
  });

  it("puts every type under a section", () => {
    render(<NotificationsForm settings={SAVED} />);

    const tasks = screen.getByText("Tasks").closest("details");
    const groups = screen.getByText("Groups").closest("details");

    expect(tasks).toHaveTextContent("Task reminders");
    expect(groups).toHaveTextContent("New member joined");
    expect(groups).not.toHaveTextContent("Task reminders");
  });

  it("saves nothing until there is something to save", () => {
    render(<NotificationsForm settings={SAVED} />);

    expect(save()).toBeDisabled();
    expect(screen.queryByText(/unsaved changes/)).not.toBeInTheDocument();
  });

  it("says there are unsaved changes as soon as a switch moves", async () => {
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SAVED} />);

    await user.click(screen.getByRole("switch", { name: REMINDER_IN_APP }));

    expect(screen.getByRole("switch", { name: REMINDER_IN_APP })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("You have unsaved changes");
    expect(save()).toBeEnabled();
    expect(saveNotificationsAction).not.toHaveBeenCalled();
  });

  it("sends one list per channel when it is saved", async () => {
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SAVED} />);

    await user.click(screen.getByRole("switch", { name: REMINDER_IN_APP }));
    await user.click(save());

    expect(saveNotificationsAction).toHaveBeenCalledTimes(1);
    const data = saveNotificationsAction.mock.calls[0]?.[1];
    expect(data?.getAll("inApp")).toEqual([
      "TASK_ASSIGNED",
      "TASK_COMPLETED",
      "TASK_REMINDER",
      "MEMBER_JOINED",
    ]);
    expect(data?.getAll("email")).toEqual(["TASK_ASSIGNED", "MEMBER_JOINED"]);
  });

  it("empties a whole column from its own switch", async () => {
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SAVED} />);

    await user.click(
      screen.getByRole("switch", { name: "Turn in app off for every notification" }),
    );

    for (const name of [
      "Task assigned to me, in app",
      "Task completed, in app",
      "Task reminders, in app",
      "New member joined, in app",
    ]) {
      expect(screen.getByRole("switch", { name })).not.toBeChecked();
    }
    expect(screen.getByRole("switch", { name: "Task assigned to me, email" })).toBeChecked();
  });

  it("offers to turn a column back on once nothing is left on it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SILENT_IN_APP} />);

    await user.click(screen.getByRole("switch", { name: "Turn in app on for every notification" }));

    expect(screen.getByRole("switch", { name: "Task reminders, in app" })).toBeChecked();
  });

  it("keeps the saved switches on screen once the save answers", async () => {
    hold();
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SAVED} />);

    await user.click(
      screen.getByRole("switch", { name: "Turn in app off for every notification" }),
    );
    await user.click(save());
    await settle({ error: null, settings: SILENT_IN_APP, done: true });

    expect(screen.getByRole("switch", { name: "Task assigned to me, in app" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Task assigned to me, email" })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Your notification choices are saved.");
    expect(save()).toBeDisabled();
  });

  it("keeps the edits when the save is refused, so they can be sent again", async () => {
    saveNotificationsAction.mockImplementation(async () => ({ error: "The server said no." }));
    const user = userEvent.setup({ delay: null });
    render(<NotificationsForm settings={SAVED} />);

    await user.click(screen.getByRole("switch", { name: REMINDER_IN_APP }));
    await user.click(save());

    expect(await screen.findByRole("alert")).toHaveTextContent("The server said no.");
    expect(screen.getByRole("switch", { name: REMINDER_IN_APP })).toBeChecked();
    expect(save()).toBeEnabled();
  });
});
