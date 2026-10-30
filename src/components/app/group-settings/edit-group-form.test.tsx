// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  saved: boolean;
  fieldErrors?: { name?: string; description?: string };
  values?: { name: string; description: string };
};

const updateGroupDetailsAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null, saved: true }),
);

vi.mock("@/app/(app)/app/groups/[uid]/settings/actions/actions", () => ({
  updateGroupDetailsAction: (previous: unknown, data: FormData) =>
    updateGroupDetailsAction(previous, data),
}));

import { EditGroupForm } from "@/components/app/group-settings/edit-group-form";

const BASE = { groupUid: "g1", name: "Flat 4", description: "Ours", photoUrl: "" };

beforeEach(() => {
  updateGroupDetailsAction.mockClear();
  updateGroupDetailsAction.mockImplementation(async () => ({ error: null, saved: true }));
});

describe("EditGroupForm", () => {
  it("starts from the details the group already has", () => {
    render(<EditGroupForm {...BASE} />);

    expect(screen.getByLabelText("Group name")).toHaveValue("Flat 4");
    expect(screen.getByLabelText("Description")).toHaveValue("Ours");
  });

  it("posts the group alongside the details", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.clear(screen.getByLabelText("Group name"));
    await user.type(screen.getByLabelText("Group name"), "Flat 5");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const posted = updateGroupDetailsAction.mock.calls[0]?.[1];
    expect(posted?.get("groupUid")).toBe("g1");
    expect(posted?.get("name")).toBe("Flat 5");
  });

  it("does not submit a group with no name", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.clear(screen.getByLabelText("Group name"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateGroupDetailsAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name for the group.")).toBeInTheDocument();
  });

  it("says the details were saved", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Group details saved.")).toBeInTheDocument();
  });

  it("takes the success back once the fields are edited again", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Group details saved.");
    await user.type(screen.getByLabelText("Group name"), "!");

    expect(screen.queryByText("Group details saved.")).toBeNull();
  });

  it("takes a link to a picture and posts it with the rest", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.type(screen.getByLabelText("Picture link"), "https://img.test/flat.png");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateGroupDetailsAction.mock.calls[0]?.[1].get("photoUrl")).toBe(
      "https://img.test/flat.png",
    );
  });

  it("does not submit a link it cannot draw", async () => {
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.type(screen.getByLabelText("Picture link"), "example.test/flat.png");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateGroupDetailsAction).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter a link starting with https://, or leave this empty."),
    ).toBeInTheDocument();
  });

  it("draws the picture it was given, and the group's letter without one", () => {
    const { container, unmount } = render(
      <EditGroupForm {...BASE} photoUrl="https://img.test/flat.png" />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "https://img.test/flat.png");
    unmount();

    render(<EditGroupForm {...BASE} />);
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("reports a refusal above the form", async () => {
    updateGroupDetailsAction.mockImplementation(async () => ({
      error: "Only an admin can do that.",
      saved: false,
    }));
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an admin can do that.");
  });

  it("shows a field the backend refused, and drops it once that field is edited", async () => {
    updateGroupDetailsAction.mockImplementation(async () => ({
      error: null,
      saved: false,
      fieldErrors: { name: "That name is taken." },
    }));
    const user = userEvent.setup({ delay: null });
    render(<EditGroupForm {...BASE} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("That name is taken.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Group name"), "!");
    expect(screen.queryByText("That name is taken.")).toBeNull();
  });
});
