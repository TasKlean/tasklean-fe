// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecoveryCodes } from "@/components/app/recovery-codes/recovery-codes";

const CODES = ["abcd-2345", "efgh-6789", "jkmn-pqrs"];

const PROPS = { codes: CODES, doneHref: "/app/settings/two-factor", onDone: () => {} };

describe("RecoveryCodes", () => {
  it("lists every code it was given", () => {
    render(<RecoveryCodes {...PROPS} />);

    for (const code of CODES) {
      expect(screen.getByText(code)).toBeVisible();
    }
  });

  it("offers the codes as a file, named for what it holds", () => {
    render(<RecoveryCodes {...PROPS} />);

    const download = screen.getByRole("link", { name: "Download" });

    expect(download).toHaveAttribute("download", "tasklean-recovery-codes.txt");
    expect(download.getAttribute("href")).toContain(encodeURIComponent("abcd-2345"));
  });

  it("copies every code at once, not one at a time", () => {
    render(<RecoveryCodes {...PROPS} />);

    expect(screen.getByRole("button", { name: "Copy codes" })).toBeVisible();
  });

  it("falls back to a plain load of the page, for a browser running no scripts", () => {
    render(<RecoveryCodes {...PROPS} />);

    expect(screen.getByRole("link", { name: "I have saved them" })).toHaveAttribute(
      "href",
      "/app/settings/two-factor",
    );
  });

  it("hands the page off instead of following the href, which goes nowhere", () => {
    const onDone = vi.fn();
    render(<RecoveryCodes {...PROPS} onDone={onDone} />);

    const followed = fireEvent.click(screen.getByRole("link", { name: "I have saved them" }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(followed).toBe(false);
  });
});
