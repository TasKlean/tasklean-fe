// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { CodeInput } from "@/components/common/code-input";

function Harness({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [code, setCode] = useState(initial);
  return (
    <CodeInput
      name="code"
      label="6-digit code"
      value={code}
      onChange={setCode}
      autoFocus={autoFocus}
    />
  );
}

function FormHarness({ initial = "", onSubmit }: { initial?: string; onSubmit: () => void }) {
  const [code, setCode] = useState(initial);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <CodeInput name="code" label="6-digit code" value={code} onChange={setCode} />
      <button type="submit">Verify</button>
    </form>
  );
}

function boxes() {
  return Array.from({ length: 6 }, (_, i) => screen.getByLabelText(`Digit ${i + 1}`));
}

function hidden(): HTMLInputElement {
  return document.querySelector('input[type="hidden"][name="code"]') as HTMLInputElement;
}

describe("CodeInput", () => {
  it("fills boxes left to right and advances focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.keyboard("123456");

    expect(boxes().map((b) => (b as HTMLInputElement).value)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(hidden().value).toBe("123456");
  });

  it("ignores characters that are not digits", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.keyboard("1a2-b3");

    expect(hidden().value).toBe("123");
  });

  it("stops at six digits", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.keyboard("123456789");

    expect(hidden().value).toBe("123456");
  });

  it("deletes backwards with backspace", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1234" />);

    await user.click(boxes()[3]);
    await user.keyboard("{Backspace}{Backspace}");

    expect(hidden().value).toBe("12");
  });

  it("spreads a pasted code across the boxes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.paste("842910");

    expect(hidden().value).toBe("842910");
  });

  it("strips separators out of a pasted code", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[0]);
    await user.paste("84-29 10");

    expect(hidden().value).toBe("842910");
  });

  it("leaves no gap when a later box is clicked first", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(boxes()[4]);
    await user.keyboard("7");

    expect(hidden().value).toBe("7");
    expect((boxes()[0] as HTMLInputElement).value).toBe("7");
  });

  it("offers the one-time-code hint on the first box only", () => {
    render(<Harness />);

    expect(boxes()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(boxes()[1]).toHaveAttribute("autocomplete", "off");
  });

  it("asks for a numeric keypad on every box", () => {
    render(<Harness />);

    for (const box of boxes()) expect(box).toHaveAttribute("inputmode", "numeric");
  });

  it("leaves focus alone by default", () => {
    render(<Harness />);

    expect(boxes()[0]).not.toHaveFocus();
  });

  it("focuses the first box only when asked", () => {
    render(<Harness autoFocus />);

    expect(boxes()[0]).toHaveFocus();
    expect(boxes()[1]).not.toHaveFocus();
  });
});

describe("CodeInput and its form", () => {
  it("submits as soon as the last digit is typed", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FormHarness onSubmit={onSubmit} />);

    await user.click(boxes()[0]);
    await user.keyboard("123456");

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("submits a pasted code too", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FormHarness onSubmit={onSubmit} />);

    await user.click(boxes()[0]);
    await user.paste("123456");

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("stays put for a code that arrived with the form, as an email link's does", async () => {
    const onSubmit = vi.fn();
    render(<FormHarness initial="123456" onSubmit={onSubmit} />);

    await Promise.resolve();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits again once a corrected digit completes the code", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FormHarness onSubmit={onSubmit} />);

    await user.click(boxes()[0]);
    await user.keyboard("123456");
    await user.keyboard("{Backspace}");
    await user.keyboard("9");

    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("does not submit a code that is still short", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FormHarness onSubmit={onSubmit} />);

    await user.click(boxes()[0]);
    await user.keyboard("12345");

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
