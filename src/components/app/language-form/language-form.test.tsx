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
  it("offers each language in its own name, with the saved one selected", () => {
    render(<LanguageForm locale="SL" />);

    const select = screen.getByLabelText("Language");
    expect(select).toHaveValue("SL");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Slovenščina" })).toBeInTheDocument();
  });

  it("sends the language that was chosen", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.selectOptions(screen.getByLabelText("Language"), "DE");
    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(saveLanguageAction).toHaveBeenCalledTimes(1);
    expect(saveLanguageAction.mock.calls[0]?.[1]?.get("locale")).toBe("DE");
  });

  it("keeps the chosen language on screen once the save answers", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LanguageForm locale="EN" />);

    await user.selectOptions(screen.getByLabelText("Language"), "DE");
    await user.click(screen.getByRole("button", { name: "Save language" }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toHaveValue("DE");
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
