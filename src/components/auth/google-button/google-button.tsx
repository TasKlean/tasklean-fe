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
import type {
  GoogleActionState,
  GoogleButtonProps,
  GoogleCredentialResponse,
} from "@/components/auth/google-button/google-button.types";
import { BusyOverlay } from "@/components/common/busy-overlay/busy-overlay";
import {
  announceGis,
  configureGis,
  gisIsReady,
  gisNonceIsStale,
  GSI_SRC,
  setGisHandler,
  subscribeToGis,
} from "@/components/auth/google-button/gis";

const INITIAL: GoogleActionState = { error: null };

// Google rejects a wider button and ignores a CSS width.
const MAX_WIDTH = 400;

const LABELS = {
  signin: "signin_with",
  signup: "signup_with",
  link: "continue_with",
} as const;

/** Renders Google's button and posts its credential to the given action. */
export function GoogleButton({
  action,
  clientId,
  intent,
  next,
  nonceHash,
}: Readonly<GoogleButtonProps>) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [width, setWidth] = useState(0);
  const slot = useRef<HTMLDivElement>(null);

  // Read from the global rather than from onLoad: next/script does not fire it
  // again for a script it has already loaded, so a client-side navigation back
  // to this screen would otherwise wait for an event that never comes.
  const ready = useSyncExternalStore(subscribeToGis, gisIsReady, () => false);

  // A refused attempt keeps its nonce, so this normally stays the one Proxy
  // minted. A replacement only arrives when there was none to keep.
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

  useEffect(() => setGisHandler(submit), [submit]);

  useEffect(() => {
    const node = slot.current;
    if (!ready || !node || width === 0) return;

    // A new nonce cannot reach a configured GIS, so the document is replaced
    // rather than initialized a second time.
    if (gisNonceIsStale(clientId, activeNonce)) {
      window.location.reload();
      return;
    }

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
      text: LABELS[intent],
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

      {/* A fixed box rather than a floor: Google's widget measures 80px for a
          frame before settling at 44, and a floor passes that on to the page. */}
      {/* Google's iframe is a light document: under our dark scheme a rebuilt one paints its canvas opaque. */}
      <div
        ref={slot}
        aria-busy={pending}
        className="flex h-13 items-center justify-center overflow-hidden [&_iframe]:[color-scheme:light]"
      />

      {/* Over the whole card, not a line under the button: Google's popup has
          closed by now, so a quiet strip reads as nothing happening. */}
      {pending ? (
        <BusyOverlay>
          {intent === "link" ? "Linking your Google account…" : "Signing you in with Google…"}
        </BusyOverlay>
      ) : null}
    </div>
  );
}
