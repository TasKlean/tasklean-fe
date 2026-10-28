// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = {
  error: string | null;
  fieldErrors?: { name?: string; description?: string };
  values?: { name: string; description?: string };
};

const createGroupAction = vi.fn<(previous: unknown, data: FormData) => Promise<State>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/groups/new/actions/actions", () => ({
  createGroupAction: (previous: unknown, data: FormData) => createGroupAction(previous, data),
}));

import { CreateGroupForm } from "@/components/app/create-group-form/create-group-form";

beforeEach(() => {
  createGroupAction.mockClear();
  createGroupAction.mockImplementation(async () => ({ error: null }));
});

describe("CreateGroupForm", () => {
  it("asks for a name, and marks it required", () => {
    render(<CreateGroupForm />);

    expect(screen.getByLabelText("Group name")).toBeRequired();
  });

  it("does not submit a group with no name", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CreateGroupForm />);

    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(createGroupAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name for the group.")).toBeInTheDocument();
  });

  it("says nothing about the empty name until the press", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CreateGroupForm />);

    await user.click(screen.getByLabelText("Group name"));
    await user.tab();

    expect(screen.queryByText("Enter a name for the group.")).not.toBeInTheDocument();
  });

  it("submits the name and the description it was given", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CreateGroupForm />);

    await user.type(screen.getByLabelText("Group name"), "Flat 12");
    await user.type(screen.getByLabelText("Description"), "The upstairs place");
    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(createGroupAction).toHaveBeenCalledTimes(1);
    const sent = createGroupAction.mock.calls[0][1];
    expect(sent.get("name")).toBe("Flat 12");
    expect(sent.get("description")).toBe("The upstairs place");
  });

  it("creates a group with no description at all", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CreateGroupForm />);

    await user.type(screen.getByLabelText("Group name"), "Flat 12");
    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(createGroupAction).toHaveBeenCalledTimes(1);
  });

  it("stops the description at the backend's column, so a 400 cannot happen", () => {
    render(<CreateGroupForm />);

    expect(screen.getByLabelText("Description")).toHaveAttribute("maxLength", "2000");
  });

  it("reports a refused create as an alert", async () => {
    createGroupAction.mockResolvedValueOnce({ error: "Something went wrong. Please try again." });
    const user = userEvent.setup({ delay: null });
    render(<CreateGroupForm />);

    await user.type(screen.getByLabelText("Group name"), "Flat 12");
    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
