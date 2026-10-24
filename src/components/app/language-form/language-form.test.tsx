// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; done?: boolean };

const saveLanguageAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, done: true }),
);

vi.mock("@/app/(app)/app/settings/language/actions", () => ({
  saveLanguageAction: (previous: unknown, data: FormData) => saveLanguageAction(previous, data),
}));

import { LanguageForm } from "@/components/app/language-form/language-form";

beforeEach(() => {
  saveLanguageAction.mockClear();
  saveLanguageAction.mockImplementation(async () => ({ error: null, done: true }));
});

describe("LanguageForm", () => {
  it("shows the saved language without opening", () => {
    render(<LanguageForm locale="SL" />);

    expect(screen.getByLabelText("Language")).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveTextContent("Slovenščina");
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("offers each language in its own name, with the saved one selected", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="SL" />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "English",
      "Deutsch",
      "Slovenščina",
    ]);
    expect(screen.getByRole("option", { name: "Slovenščina" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("sends the language that was chosen", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Deutsch" }));
    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(saveLanguageAction).toHaveBeenCalledTimes(1);
    expect(saveLanguageAction.mock.calls[0]?.[1]?.get("locale")).toBe("DE");
  });

  it("picks a language from the keyboard alone", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(screen.getByRole("combobox")).toHaveTextContent("Deutsch");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape without changing the language", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("English");
  });

  it("keeps the chosen language on screen once the save answers", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Deutsch" }));
    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Deutsch");
  });

  it("confirms a save", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your language is saved.");
  });

  it("reports a refused save", async () => {
    saveLanguageAction.mockImplementation(async () => ({ error: "The server said no." }));
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server said no.");
  });
});
