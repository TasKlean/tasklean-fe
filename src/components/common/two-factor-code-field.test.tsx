// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TwoFactorCodeField } from "@/components/common/two-factor-code-field";

function Host({ onSwitch }: { onSwitch?: () => void }) {
  const [code, setCode] = useState("");

  return (
    <form>
      <TwoFactorCodeField name="code" value={code} onChange={setCode} onSwitch={onSwitch}>
        <button type="submit">Confirm</button>
      </TwoFactorCodeField>
    </form>
  );
}

describe("TwoFactorCodeField", () => {
  it("starts on the six boxes", () => {
    render(<Host />);

    expect(screen.getByLabelText("Digit 1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Recovery code")).toBeNull();
  });

  it("swaps in one field for a recovery code, and back", async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));

    expect(screen.getByLabelText("Recovery code")).toBeInTheDocument();
    expect(screen.queryByLabelText("Digit 1")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Use your authenticator app instead" }));

    expect(screen.getByLabelText("Digit 1")).toBeInTheDocument();
  });

  it("drops a code that belongs to the kind being left", async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(screen.getByLabelText("Digit 1"), "123");
    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));

    expect(screen.getByLabelText("Recovery code")).toHaveValue("");
  });

  it("tells the form the kind changed, so it can forget its own verdict", async () => {
    const onSwitch = vi.fn();
    const user = userEvent.setup();
    render(<Host onSwitch={onSwitch} />);

    await user.click(screen.getByRole("button", { name: "Use a recovery code instead" }));

    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("keeps the switch below whatever acts on the code", async () => {
    render(<Host />);

    const buttons = screen.getAllByRole("button").map((button) => button.textContent);

    expect(buttons).toEqual(["Confirm", "Use a recovery code instead"]);
  });
});
