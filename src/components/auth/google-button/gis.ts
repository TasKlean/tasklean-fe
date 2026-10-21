/**
 * Google Identity Services as this page's single owner of it. Their API is a
 * page-level singleton, so the state lives here and a mounted button only swaps
 * the handler it routes credentials to.
 */

import type {
  GoogleCredentialResponse,
  GoogleIdApi,
} from "@/components/auth/google-button/google-button.types";

export const GSI_SRC = "https://accounts.google.com/gsi/client";

const gisListeners = new Set<() => void>();

let gisHandler: ((response: GoogleCredentialResponse) => void) | null = null;

let gisConfiguredFor: { clientId: string; nonceHash: string; api: GoogleIdApi } | null = null;

/** Subscribes to Google's script loading, for useSyncExternalStore. */
export function subscribeToGis(onChange: () => void): () => void {
  gisListeners.add(onChange);
  return () => gisListeners.delete(onChange);
}

/** Reports whether Google's script has defined its API yet. */
export function gisIsReady(): boolean {
  return typeof window.google?.accounts?.id === "object";
}

/** Wakes every mounted button when the script finishes loading. */
export function announceGis(): void {
  for (const listener of gisListeners) listener();
}

/**
 * Routes Google's credentials to one handler.
 *
 * @returns A release that clears the handler only while it is still the one set.
 */
export function setGisHandler(handler: (response: GoogleCredentialResponse) => void): () => void {
  gisHandler = handler;
  return () => {
    if (gisHandler === handler) gisHandler = null;
  };
}

/**
 * Configures Google once per client id and nonce, and returns its API.
 *
 * @returns The API, or null while the script has not defined it.
 */
export function configureGis(clientId: string, nonceHash: string): GoogleIdApi | null {
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
