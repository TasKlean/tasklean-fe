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
 * Never initializes twice over one API object: `gisNonceIsStale` reports that
 * case, and only a fresh document can clear it.
 *
 * @returns The API, or null while the script has not defined it or this
 * document already holds another nonce.
 */
export function configureGis(clientId: string, nonceHash: string): GoogleIdApi | null {
  const api = window.google?.accounts.id;
  if (!api) return null;
  // A replaced API object means a fresh script, so the old call no longer counts.
  if (gisConfiguredFor?.api === api) {
    const unchanged =
      gisConfiguredFor.clientId === clientId && gisConfiguredFor.nonceHash === nonceHash;
    return unchanged ? api : null;
  }

  api.initialize({
    client_id: clientId,
    nonce: nonceHash,
    callback: (response) => gisHandler?.(response),
  });
  gisConfiguredFor = { clientId, nonceHash, api };
  return api;
}

/**
 * Reports whether this document already configured Google with another nonce.
 *
 * Google refuses a second `initialize()`: it warns that only the last call
 * counts, and the credential it then mints can still carry the first nonce,
 * which the backend compares against our cookie and refuses. Signing out and
 * back in with Google is the path that hits it, since the spent nonce is
 * replaced while the page's JavaScript lives on.
 */
export function gisNonceIsStale(clientId: string, nonceHash: string): boolean {
  const api = window.google?.accounts.id;
  if (!api || gisConfiguredFor?.api !== api) return false;
  return gisConfiguredFor.clientId !== clientId || gisConfiguredFor.nonceHash !== nonceHash;
}
