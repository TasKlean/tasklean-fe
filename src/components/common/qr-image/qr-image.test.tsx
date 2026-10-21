// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QrImage } from "@/components/common/qr-image/qr-image";

const CODE = { size: 25, path: "M2 2h7v1h-7z" };

describe("QrImage", () => {
  it("says what the code is for", () => {
    render(<QrImage code={CODE} label="Scan this with your authenticator app" />);

    expect(
      screen.getByRole("img", { name: "Scan this with your authenticator app" }),
    ).toBeVisible();
  });

  it("draws the path it was given", () => {
    render(<QrImage code={CODE} label="A code" />);

    expect(screen.getByRole("img").querySelector("path")).toHaveAttribute("d", CODE.path);
  });

  it("sizes the viewBox in modules, so the box does the scaling", () => {
    render(<QrImage code={CODE} label="A code" />);

    expect(screen.getByRole("img")).toHaveAttribute("viewBox", "0 0 25 25");
  });
});
