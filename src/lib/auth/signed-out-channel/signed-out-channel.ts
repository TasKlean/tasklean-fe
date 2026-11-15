/**
 * The one channel a tab says "the session is over" on, so every other tab in
 * this browser can stop showing a signed-in page. The session cookie is already
 * gone by then, browser wide: this only carries the news.
 *
 * Client-safe, unlike the rest of `lib/auth`: both ends run in the browser, so
 * nothing here may import `server-only`. It carries no payload worth having,
 * since any script on this origin can open the same channel.
 */

const CHANNEL_NAME = "tasklean_signed_out";

// The only message the channel carries. A constant rather than a bare post so
// the listener can tell ours from anything else opening the same name.
const SIGNED_OUT = "signed-out";

/** Reports whether this browser has the API, which an older one does not. */
function supported(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

/**
 * Tells every other tab in this browser that the session has ended.
 *
 * The sender never receives its own message, so the tab that signed out is not
 * refreshed by its own post.
 */
export function broadcastSignedOut(): void {
  if (!supported()) return;

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(SIGNED_OUT);
  // Safe to close at once: delivery is queued on each receiving tab's own
  // event loop, so it survives this tab navigating away a moment later.
  channel.close();
}

/**
 * Runs a handler whenever another tab reports the session has ended.
 *
 * @returns The teardown, which the caller must run: an open channel outlives
 * the component that opened it and a remount would answer twice.
 */
export function onSignedOut(handler: () => void): () => void {
  if (!supported()) return () => {};

  const channel = new BroadcastChannel(CHANNEL_NAME);
  // Checked rather than trusted: any script on this origin can post here, and
  // an unchecked message would bounce every tab to login.
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (event.data === SIGNED_OUT) handler();
  };

  return () => channel.close();
}
