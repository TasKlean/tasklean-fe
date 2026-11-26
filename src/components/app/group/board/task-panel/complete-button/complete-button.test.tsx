// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; done: string | null };

const completeTaskAction = vi.fn<(previous: State, data: FormData) => Promise<State>>(async () => ({
  error: null,
  done: "Marked done. It comes round again tomorrow.",
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  completeTaskAction: (previous: State, data: FormData) => completeTaskAction(previous, data),
}));

import { CompleteButton } from "@/components/app/group/board/task-panel/complete-button/complete-button";

const onDetails = vi.fn();
const onNotice = vi.fn();
const onBusy = vi.fn();

function button(overrides: Partial<React.ComponentProps<typeof CompleteButton>> = {}) {
  return render(
    <CompleteButton
      size="lg"
      groupUid="g1"
      taskUid="t1"
      requiresProof={false}
      heldBy={null}
      doneFor={null}
      busy={false}
      onBusy={onBusy}
      onDetails={onDetails}
      onNotice={onNotice}
      {...overrides}
    />,
  );
}

/** Reads what the press posted, which is a form rather than arguments. */
function posted(): Record<string, string> {
  const data = completeTaskAction.mock.calls[0]?.[1];

  return Object.fromEntries(
    [...(data?.entries() ?? [])].map(([key, value]) => [key, String(value)]),
  );
}

beforeEach(() => {
  completeTaskAction.mockClear();
  onDetails.mockClear();
  onNotice.mockClear();
  onBusy.mockClear();
});

describe("CompleteButton", () => {
  it("records a round in one press, carrying nothing but the task", async () => {
    button();
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => expect(completeTaskAction).toHaveBeenCalled());
    expect(posted()).toEqual({ groupUid: "g1", taskUid: "t1" });
  });

  it("reports what the round did, so the panel can say it", async () => {
    button();
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() =>
      expect(onNotice).toHaveBeenCalledWith({
        tone: "success",
        text: "Marked done. It comes round again tomorrow.",
      }),
    );
  });

  it("reports a refusal rather than swallowing it", async () => {
    completeTaskAction.mockResolvedValueOnce({
      error: "Not due yet. You can record this from tomorrow.",
      done: null,
    });

    button();
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() =>
      expect(onNotice).toHaveBeenCalledWith({
        tone: "error",
        text: "Not due yet. You can record this from tomorrow.",
      }),
    );
  });

  it("offers no one-press path for a task that asks for proof", async () => {
    button({ requiresProof: true });

    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Complete with proof" }));

    expect(onDetails).toHaveBeenCalled();
    expect(completeTaskAction).not.toHaveBeenCalled();
  });

  it("draws a dead press naming whose task it is, the endpoint refusing anybody else", async () => {
    button({ heldBy: "Ana Kovac" });

    const press = screen.getByRole("button", { name: "Assigned to Ana Kovac" });
    expect(press).toBeDisabled();

    await userEvent.click(press);

    expect(completeTaskAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
  });

  it("blocks a task that is somebody else's even where it asks for proof", () => {
    button({ heldBy: "Ana Kovac", requiresProof: true });

    expect(screen.queryByRole("button", { name: "Complete with proof" })).toBeNull();
  });

  it("opens the longer way from the press beside the simple one", async () => {
    button();
    await userEvent.click(screen.getByRole("button", { name: "Other ways to complete" }));
    await userEvent.click(screen.getByRole("button", { name: "Complete with details" }));

    expect(onDetails).toHaveBeenCalled();
    expect(completeTaskAction).not.toHaveBeenCalled();
  });

  it("records nothing while the panel's other press is in flight", async () => {
    button({ busy: true });

    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    expect(completeTaskAction).not.toHaveBeenCalled();
  });

  it("tells the panel it is recording, so the other press stops", async () => {
    button();
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => expect(onBusy).toHaveBeenCalledWith(true));
    await waitFor(() => expect(onBusy).toHaveBeenLastCalledWith(false));
  });

  it("keeps the longer way out of the header, where there is no room", () => {
    button({ size: "sm" });

    expect(screen.queryByRole("button", { name: "Other ways to complete" })).toBeNull();
    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
  });
});

describe("a task already done ahead of schedule", () => {
  it("draws a dead press naming the round rather than a form", () => {
    button({ doneFor: "14 Mar" });

    expect(screen.getByRole("button", { name: /Done for 14 Mar/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
  });
});
