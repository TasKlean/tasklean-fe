// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { act, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoogleRenderOptions } from "@/components/auth/google-button/google-button.types";

const googleSignInAction = vi.fn<
  (previous: unknown, data: FormData) => Promise<{ error: string | null; nonceHash?: string }>
>(async () => ({ error: null }));

let scriptLoadsNow = true;

function ScriptStub({ onLoad }: { onLoad?: () => void }) {
  useEffect(() => {
    if (scriptLoadsNow) onLoad?.();
  }, [onLoad]);
  return null;
}

vi.mock("next/script", () => ({ default: ScriptStub }));

import { GoogleButton } from "@/components/auth/google-button/google-button";

const initialize = vi.fn();
const renderButton = vi.fn();

let credentialCallback: (response: { credential?: string }) => void;

function stubGoogle(): void {
  initialize.mockImplementation((config: { callback: typeof credentialCallback }) => {
    credentialCallback = config.callback;
  });
  window.google = { accounts: { id: { initialize, renderButton } } };
}

function stubResizeObserver(width: number): void {
  window.ResizeObserver = class {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
      this.callback([{ contentRect: { width } } as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  };
}

function lastOptions(): GoogleRenderOptions {
  return renderButton.mock.calls.at(-1)?.[1] as GoogleRenderOptions;
}

beforeEach(() => {
  vi.restoreAllMocks();
  initialize.mockReset();
  renderButton.mockReset();
  googleSignInAction.mockClear();
  googleSignInAction.mockResolvedValue({ error: null });
  scriptLoadsNow = true;
  stubGoogle();
  stubResizeObserver(320);
});

describe("GoogleButton rendering", () => {
  it("initializes Google with our client id", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: "client-123" }));
  });

  it("gives Google the nonce hash, so the token carries it", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ nonce: "hash-1" }));
  });

  it("asks for the sign-in label on login", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(lastOptions().text).toBe("signin_with");
  });

  it("asks for the sign-up label on register", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signup"
        nonceHash="hash-1"
      />,
    );

    expect(lastOptions().text).toBe("signup_with");
  });

  it("fits the widget to the container, since Google ignores a CSS width", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(lastOptions().width).toBe(320);
  });

  it("caps the width Google would reject", () => {
    stubResizeObserver(900);
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(lastOptions().width).toBe(400);
  });

  it("asks for the one theme legible on both colour schemes", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(lastOptions().theme).toBe("outline");
  });

  it("configures Google once, however often the widget is re-rendered", async () => {
    const { rerender } = render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    rerender(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signup"
        nonceHash="hash-1"
      />,
    );

    expect(renderButton.mock.calls.length).toBeGreaterThan(1);
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it("renders when Google's script loaded before this screen mounted", () => {
    scriptLoadsNow = false;
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(renderButton).toHaveBeenCalled();
  });

  it("holds a fixed box, so Google's widget cannot resize the page around it", () => {
    const { container } = render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(container.querySelector("div[aria-busy]")).toHaveClass("h-13", "overflow-hidden");
  });

  it("renders nothing until Google has defined its API", () => {
    delete window.google;
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(renderButton).not.toHaveBeenCalled();
  });
});

describe("GoogleButton credential handling", () => {
  it("sends the credential and the next path to the action", async () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        next="/groups"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "id-token-1" }));

    const submitted = googleSignInAction.mock.calls.at(-1)?.[1];
    expect(submitted?.get("idToken")).toBe("id-token-1");
    expect(submitted?.get("next")).toBe("/groups");
  });

  it("omits the next path when there is none", async () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "id-token-1" }));

    const submitted = googleSignInAction.mock.calls.at(-1)?.[1];
    expect(submitted?.has("next")).toBe(false);
  });

  it("shows progress while the action is in flight", async () => {
    let release: (result: { error: string | null }) => void = () => {};
    googleSignInAction.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "id-token-1" }));

    expect(screen.getByRole("status")).toHaveTextContent("Signing you in with Google");

    await act(async () => {
      release({ error: null });
    });
  });

  it("covers the card while the action runs, rather than a line under the button", async () => {
    let release: (result: { error: string | null }) => void = () => {};
    googleSignInAction.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "id-token-1" }));

    expect(screen.getByRole("status").parentElement).toHaveClass("absolute", "inset-0");

    await act(async () => {
      release({ error: null });
    });
  });

  it("covers nothing before an attempt starts", () => {
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps its nonce when an attempt is refused", async () => {
    googleSignInAction.mockResolvedValue({ error: "Invalid Google token" });
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "stale" }));

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenLastCalledWith(expect.objectContaining({ nonce: "hash-1" }));
  });

  it("reloads rather than handing Google a second nonce", async () => {
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ reload } as unknown as Location);
    googleSignInAction.mockResolvedValue({
      error: "That sign-in attempt expired.",
      nonceHash: "hash-2",
    });
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "stale" }));

    expect(reload).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it("shows the error the action returned", async () => {
    googleSignInAction.mockResolvedValue({ error: "Invalid Google token" });
    render(
      <GoogleButton
        action={googleSignInAction}
        clientId="client-123"
        intent="signin"
        nonceHash="hash-1"
      />,
    );

    await act(async () => credentialCallback({ credential: "stale" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid Google token");
  });
});
