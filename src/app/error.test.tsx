// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

describe("ErrorPage", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries through the boundary's own reset", async () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the error so a browser-side crash leaves a record", () => {
    const error = new Error("boom");
    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(console.error).toHaveBeenCalledWith(error);
  });

  it("shows the digest when there is one", () => {
    render(
      <ErrorPage error={Object.assign(new Error("boom"), { digest: "abc123" })} reset={vi.fn()} />,
    );

    expect(screen.getByText("Reference: abc123")).toBeInTheDocument();
  });

  it("hides the reference line without a digest", () => {
    render(<ErrorPage error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.queryByText(/^Reference:/)).toBeNull();
  });
});
