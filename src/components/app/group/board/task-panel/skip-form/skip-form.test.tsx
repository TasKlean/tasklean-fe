// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; done: string | null };

const skipRoundAction = vi.fn<(previous: State, data: FormData) => Promise<State>>(async () => ({
  error: null,
  done: "Skipped. It comes round again tomorrow.",
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  skipRoundAction: (previous: State, data: FormData) => skipRoundAction(previous, data),
}));

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { SkipForm } from "@/components/app/group/board/task-panel/skip-form/skip-form";

const onCancel = vi.fn();
const onDone = vi.fn();

function form() {
  return render(
    <SkipForm groupUid="g1" taskUid="t1" label="Bins" onCancel={onCancel} onDone={onDone} />,
  );
}

describe("SkipForm", () => {
  beforeEach(() => {
    skipRoundAction.mockClear();
    onCancel.mockClear();
    onDone.mockClear();
  });

  it("records the round with the reason, and the task it is bound to", async () => {
    form();
    await userEvent.type(screen.getByLabelText("Reason"), "Nobody was home");
    await userEvent.click(screen.getByRole("button", { name: "Skip round" }));

    await waitFor(() => expect(skipRoundAction).toHaveBeenCalled());

    const sent = skipRoundAction.mock.calls[0]?.[1];

    expect(sent?.get("note")).toBe("Nobody was home");
    expect(sent?.get("taskUid")).toBe("t1");
    expect(sent?.get("groupUid")).toBe("g1");
  });

  it("records a round nobody gave a reason for", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "Skip round" }));

    await waitFor(() => expect(skipRoundAction).toHaveBeenCalled());
  });

  it("hands the line to the panel, which says it where the facts are", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "Skip round" }));

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith("Skipped. It comes round again tomorrow."),
    );
  });

  it("says why a refused skip was refused", async () => {
    skipRoundAction.mockResolvedValueOnce({
      error: "This round is not due yet.",
      done: null,
    });

    form();
    await userEvent.click(screen.getByRole("button", { name: "Skip round" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("not due yet"));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("leaves the view without recording anything", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
    expect(skipRoundAction).not.toHaveBeenCalled();
  });
});
