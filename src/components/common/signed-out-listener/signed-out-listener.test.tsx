// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignedOutListener } from "@/components/common/signed-out-listener/signed-out-listener";
import { broadcastSignedOut } from "@/lib/auth/signed-out-channel/signed-out-channel";

const real = window.location;
const reload = vi.fn();

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: real });
});

describe("SignedOutListener", () => {
  it("reloads the document when another tab signs out", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...real, reload },
    });
    render(<SignedOutListener />);

    broadcastSignedOut();

    await vi.waitFor(() => expect(reload).toHaveBeenCalled(), { timeout: 5_000 });
  });
});
