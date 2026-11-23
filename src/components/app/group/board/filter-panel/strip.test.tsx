// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Strip } from "@/components/app/group/board/filter-panel/strip";

function strip() {
  return render(
    <Strip id="category" className="flex overflow-x-auto">
      <label>
        <input type="radio" name="category" value="3" />
        Kitchen
      </label>
    </Strip>,
  );
}

function drag(pointerType: string) {
  const row = document.getElementById("category") as HTMLDivElement;

  fireEvent.pointerDown(row, { pointerType, clientX: 200 });
  fireEvent.pointerMove(row, { pointerType, clientX: 120 });
  fireEvent.pointerUp(row, { pointerType });
  fireEvent.click(screen.getByLabelText("Kitchen"));
}

describe("Strip", () => {
  it("ticks the pill a press lands on, nothing having moved", async () => {
    strip();
    await userEvent.click(screen.getByLabelText("Kitchen"));

    expect(screen.getByLabelText("Kitchen")).toBeChecked();
  });

  it("leaves the pill alone where the press was a drag", () => {
    strip();
    drag("mouse");

    expect(screen.getByLabelText("Kitchen")).not.toBeChecked();
  });

  it("ignores a drag that is not a mouse, a finger already scrolling the strip", () => {
    strip();
    drag("touch");

    expect(screen.getByLabelText("Kitchen")).toBeChecked();
  });
});
