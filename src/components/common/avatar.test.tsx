// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element -- the stub stands in for next/image */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "@/components/common/avatar";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...rest} />
  ),
}));

const GOOGLE_PHOTO = "https://lh3.googleusercontent.com/a/abc123=s96-c";

describe("Avatar with a photo", () => {
  it("draws a photo served from an allowed host", () => {
    const { container } = render(<Avatar photoUrl={GOOGLE_PHOTO} name="Ada" lastName="Lovelace" />);

    expect(container.querySelector("img")).toHaveAttribute("src", GOOGLE_PHOTO);
    expect(screen.queryByText("AL")).toBeNull();
  });

  it("leaves the photo out of the accessible tree, since the link names it", () => {
    const { container } = render(<Avatar photoUrl={GOOGLE_PHOTO} name="Ada" />);

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("draws a photo from any googleusercontent subdomain, not just lh3", () => {
    const photo = "https://lh5.googleusercontent.com/a/xyz=s96-c";
    const { container } = render(<Avatar photoUrl={photo} name="Ada" />);

    expect(container.querySelector("img")).toHaveAttribute("src", photo);
  });

  it("refuses a lookalike domain that merely ends in the allowed one", () => {
    const { container } = render(
      <Avatar photoUrl="https://evilgoogleusercontent.com/a/xyz" name="Ada" lastName="Lovelace" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("falls back to initials for a host the optimizer cannot fetch", () => {
    const { container } = render(
      <Avatar photoUrl="https://example.test/avatar.png" name="Ada" lastName="Lovelace" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("falls back to initials for a url that will not parse", () => {
    const { container } = render(<Avatar photoUrl="not-a-url" name="Ada" />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("Avatar without a photo", () => {
  it("shows both initials when it knows both names", () => {
    render(<Avatar name="Ada" lastName="Lovelace" />);

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("shows a neutral placeholder when it knows no name", () => {
    const { container } = render(<Avatar />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
