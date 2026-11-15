// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignedOutBroadcast } from "@/components/common/signed-out-broadcast/signed-out-broadcast";
import { onSignedOut } from "@/lib/auth/signed-out-channel/signed-out-channel";

describe("SignedOutBroadcast", () => {
  it("tells the other tabs as soon as it mounts", async () => {
    const heard = vi.fn();
    const stop = onSignedOut(heard);

    render(<SignedOutBroadcast />);

    await vi.waitFor(() => expect(heard).toHaveBeenCalledTimes(1), { timeout: 5_000 });
    stop();
  });
});
