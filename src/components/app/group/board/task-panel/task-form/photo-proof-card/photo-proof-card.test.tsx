// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PhotoProofCard } from "@/components/app/group/board/task-panel/task-form/photo-proof-card/photo-proof-card";

describe("PhotoProofCard", () => {
  it("names the switch rather than the (i), which the card would otherwise take as its control", () => {
    render(<PhotoProofCard on={false} onToggle={() => {}} />);

    expect(screen.getByRole("switch", { name: /Require photo proof/ })).toBeInTheDocument();
  });

  it("switches on a press on its words", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PhotoProofCard on={false} onToggle={onToggle} />);

    await user.click(screen.getByText("Require photo proof on completion"));

    expect(onToggle).toHaveBeenCalled();
  });
});
