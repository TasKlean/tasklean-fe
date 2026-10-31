// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupCard } from "@/components/app/group-card/group-card";

describe("GroupCard", () => {
  it("is one link to the group, so the whole card is the target", () => {
    render(<GroupCard group={{ uid: "g1", name: "Flat 12" }} />);

    expect(screen.getByRole("link", { name: /Flat 12/ })).toHaveAttribute("href", "/app/groups/g1");
  });

  it("marks a group the caller administers", () => {
    render(<GroupCard group={{ uid: "g1", name: "Flat 12", myRole: "GROUP_ADMIN" }} />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("marks nothing on a group the caller is only a member of", () => {
    render(<GroupCard group={{ uid: "g1", name: "Flat 12", myRole: "GROUP_MEMBER" }} />);

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the count and when the caller joined", () => {
    render(
      <GroupCard
        group={{ uid: "g1", name: "Flat 12", memberCount: 4, dateJoined: "2026-07-15T12:00:00" }}
      />,
    );

    expect(screen.getByText(/4 members/)).toBeInTheDocument();
    expect(screen.getByText(/Joined Jul 2026/)).toBeInTheDocument();
  });

  it("still reads as a link when the backend sent no name", () => {
    render(<GroupCard group={{ uid: "g1" }} />);

    expect(screen.getByRole("link", { name: /Untitled group/ })).toBeInTheDocument();
  });

  it("shows the description when the group has one", () => {
    render(<GroupCard group={{ uid: "g1", name: "Flat 12", description: "The upstairs place" }} />);

    expect(screen.getByText("The upstairs place")).toBeInTheDocument();
  });

  it("keeps the description's room on a group that has none, so cards match", () => {
    const { container } = render(<GroupCard group={{ uid: "g1", name: "Flat 12" }} />);

    expect(container.querySelector(".line-clamp-2")).toHaveClass("min-h-11");
  });

  it("fills the row it sits in, rather than taking its text's width", () => {
    render(<GroupCard group={{ uid: "g1", name: "Flat 12" }} />);

    expect(screen.getByRole("link", { name: /Flat 12/ })).toHaveClass("w-full");
  });
});
