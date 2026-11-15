// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { broadcastSignedOut, onSignedOut } from "@/lib/auth/signed-out-channel/signed-out-channel";

const CHANNEL = "tasklean_signed_out";
const MESSAGE = "signed-out";

const quiet = () => new Promise((resolve) => setTimeout(resolve, 50));

const ARRIVES = { timeout: 5_000 };

describe("onSignedOut", () => {
  it("runs the handler when another tab broadcasts", async () => {
    const handler = vi.fn();
    const stop = onSignedOut(handler);

    broadcastSignedOut();

    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1), ARRIVES);
    stop();
  });

  it("runs nothing once the teardown has been called", async () => {
    const handler = vi.fn();
    const stop = onSignedOut(handler);

    stop();
    broadcastSignedOut();
    await quiet();

    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores a message that is not ours, on the channel that is", async () => {
    const handler = vi.fn();
    const stop = onSignedOut(handler);
    const other = new BroadcastChannel(CHANNEL);

    other.postMessage("something else");
    await quiet();
    expect(handler).not.toHaveBeenCalled();

    other.postMessage(MESSAGE);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1), ARRIVES);

    other.close();
    stop();
  });
});

describe("without the API", () => {
  const real = globalThis.BroadcastChannel;

  afterEach(() => {
    globalThis.BroadcastChannel = real;
  });

  it("posts nothing, and hands back a teardown that still works", () => {
    globalThis.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;
    const handler = vi.fn();

    expect(() => broadcastSignedOut()).not.toThrow();

    const stop = onSignedOut(handler);
    expect(() => stop()).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});
