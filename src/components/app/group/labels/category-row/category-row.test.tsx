// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null };

const deleteCategoryAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/groups/[uid]/labels/actions/actions", () => ({
  deleteCategoryAction: (previous: unknown, data: FormData) => deleteCategoryAction(previous, data),
  updateCategoryAction: async () => ({ error: null, saved: true }),
  createCategoryAction: async () => ({ error: null, saved: true }),
}));

import { CategoryRow } from "@/components/app/group/labels/category-row/category-row";

const CATEGORY = { id: 7, name: "Kitchen", color: "#43aa8b", icon: "bath" };

beforeEach(() => {
  deleteCategoryAction.mockClear();
  deleteCategoryAction.mockImplementation(async () => ({ error: null }));
});

describe("CategoryRow", () => {
  it("offers a member nothing to press, because the filing system is the household's", () => {
    render(<CategoryRow groupUid="g1" category={CATEGORY} canManage={false} />);

    expect(screen.getByText("Kitchen")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("asks before deleting, rather than deleting on the first press", async () => {
    render(<CategoryRow groupUid="g1" category={CATEGORY} canManage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Kitchen" }));

    expect(deleteCategoryAction).not.toHaveBeenCalled();
    expect(screen.getByText("Delete Kitchen?")).toBeInTheDocument();
  });

  it("names the category and the group on the press that deletes it", async () => {
    render(<CategoryRow groupUid="g1" category={CATEGORY} canManage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Kitchen" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    const sent = deleteCategoryAction.mock.calls[0]?.[1];
    expect(sent?.get("id")).toBe("7");
    expect(sent?.get("groupUid")).toBe("g1");
  });

  it("reports a refused delete on the row, where the count of tasks arrives", async () => {
    deleteCategoryAction.mockImplementation(async () => ({
      error: "This category is still used by 3 task(s) - move them first.",
    }));
    render(<CategoryRow groupUid="g1" category={CATEGORY} canManage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Kitchen" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("still used by 3 task(s)");
  });

  it("swaps the row for its editor, rather than opening a dialog", async () => {
    render(<CategoryRow groupUid="g1" category={CATEGORY} canManage />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Kitchen" }));

    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Kitchen");
    expect(screen.queryByRole("button", { name: "Edit Kitchen" })).toBeNull();
  });
});
