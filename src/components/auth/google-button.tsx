/**
 * "Sign in with Google". Google renders the button itself, inside an iframe, so
 * it cannot take our design tokens: their widget is the only supported way to
 * obtain an ID token. Width is a constructor option rather than CSS, which is
 * why the widget is re-rendered when the container resizes.
 */

"use client";

import Script from "next/script";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { googleSignInAction, type GoogleSignInState } from "@/app/(auth)/actions";
import type {
  GoogleButtonProps,
  GoogleCredentialResponse,
  GoogleIdApi,
} from "@/components/auth/google-button.types";

const INITIAL: GoogleSignInState = { error: null };

const GSI_SRC = "https://accounts.google.com/gsi/client";

// Google rejects a wider button and ignores a CSS width.
const MAX_WIDTH = 400;

const gisListeners = new Set<() => void>();

/** Subscribes to Google's script loading, for useSyncExternalStore. */
function subscribeToGis(onChange: () => void): () => void {
  gisListeners.add(onChange);
  return () => gisListeners.delete(onChange);
}

/** Reports whether Google's script has defined its API yet. */
function gisIsReady(): boolean {
  return typeof window.google?.accounts?.id === "object";
}

/** Wakes every mounted button when the script finishes loading. */
function announceGis(): void {
  for (const listener of gisListeners) listener();
}

// Google's API is a page-level singleton: a second initialize() replaces the
// first and logs a warning, so the module owns the call and each mounted button
// only swaps the handler it routes credentials to.
let gisHandler: ((response: GoogleCredentialResponse) => void) | null = null;
let gisConfiguredFor: { clientId: string; nonceHash: string; api: GoogleIdApi } | null = null;

/**
 * Configures Google once per client id and nonce, and returns its API.
 *
 * @returns The API, or null while the script has not defined it.
 */
function configureGis(clientId: string, nonceHash: string): GoogleIdApi | null {
  const api = window.google?.accounts.id;
  if (!api) return null;
  // A replaced API object means a fresh script, so the old call no longer counts.
  if (
    gisConfiguredFor?.clientId === clientId &&
    gisConfiguredFor.nonceHash === nonceHash &&
    gisConfiguredFor.api === api
  ) {
    return api;
  }

  api.initialize({
    client_id: clientId,
    nonce: nonceHash,
    callback: (response) => gisHandler?.(response),
  });
  gisConfiguredFor = { clientId, nonceHash, api };
  return api;
}

/** Renders Google's sign-in button and turns its credential into a session. */
export function GoogleButton({ clientId, intent, next, nonceHash }: GoogleButtonProps) {
  const [state, formAction, pending] = useActionState(googleSignInAction, INITIAL);
  const [width, setWidth] = useState(0);
  const slot = useRef<HTMLDivElement>(null);

  // Read from the global rather than from onLoad: next/script does not fire it
  // again for a script it has already loaded, so a client-side navigation back
  // to this screen would otherwise wait for an event that never comes.
  const ready = useSyncExternalStore(subscribeToGis, gisIsReady, () => false);

  // A spent nonce cannot sign anyone in, so a failed attempt hands back the
  // hash of its replacement and the widget is rebuilt around it.
  const activeNonce = state.nonceHash ?? nonceHash;

  const submit = useCallback(
    (response: GoogleCredentialResponse) => {
      const data = new FormData();
      data.set("idToken", response.credential ?? "");
      if (next) data.set("next", next);
      // Google's callback is not a React event, so the transition is ours to
      // open: without it the action runs but `pending` never flips.
      startTransition(() => formAction(data));
    },
    [formAction, next],
  );

  useEffect(() => {
    const node = slot.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(Math.round(entry?.contentRect.width ?? 0), MAX_WIDTH));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    gisHandler = submit;
    return () => {
      if (gisHandler === submit) gisHandler = null;
    };
  }, [submit]);

  useEffect(() => {
    const node = slot.current;
    if (!ready || !node || width === 0) return;

    const api = configureGis(clientId, activeNonce);
    if (!api) return;

    // renderButton appends, so re-rendering would stack a second button.
    node.replaceChildren();
    api.renderButton(node, {
      type: "standard",
      // The one theme legible on both schemes: filled_black vanishes into our
      // dark card, and a bordered white pill stays visible on either.
      theme: "outline",
      size: "large",
      shape: "pill",
      text: intent === "signup" ? "signup_with" : "signin_with",
      logo_alignment: "center",
      width,
    });
  }, [activeNonce, clientId, intent, ready, width]);

  return (
    <div className="gap-space-sm flex flex-col">
      <Script src={GSI_SRC} strategy="afterInteractive" onLoad={announceGis} />

      {state.error ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {state.error}
        </p>
      ) : null}

      {/* Google's iframe is a light document: under our dark scheme a rebuilt one paints its canvas opaque. */}
      <div
        ref={slot}
        aria-busy={pending}
        className={`flex min-h-13 justify-center [&_iframe]:[color-scheme:light] ${pending ? "pointer-events-none opacity-70" : ""}`}
      />

      {pending ? (
        <p role="status" className="text-body-md text-muted-foreground text-center">
          Signing you in with Google…
        </p>
      ) : null}
    </div>
  );
}
