/**
 * The slice of Google Identity Services this app uses, hand-written like our
 * API types: the official package is a 40kB global typing we'd load for four
 * calls.
 */

export type GoogleCredentialResponse = {
  // The ID token. Absent if the user abandons the Google dialog.
  credential?: string;
};

export type GoogleIdConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  // The SHA-256 of our per-attempt secret, which Google copies into the token.
  nonce: string;
  auto_select?: boolean;
};

export type GoogleRenderOptions = {
  type: "standard";
  theme: "outline" | "filled_blue" | "filled_black";
  size: "large";
  shape: "pill";
  text: "signin_with" | "signup_with" | "continue_with";
  logo_alignment: "left" | "center";
  // Pixels. Google rejects anything above 400 and ignores a CSS width.
  width?: number;
};

export type GoogleIdApi = {
  initialize: (config: GoogleIdConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleRenderOptions) => void;
};

// What either Google action hands back. The hash belongs to the nonce minted
// for the next attempt, because this one is spent whatever the outcome.
export type GoogleActionState = {
  error: string | null;
  nonceHash?: string;
};

export type GoogleAction = (
  state: GoogleActionState,
  formData: FormData,
) => Promise<GoogleActionState>;

export type GoogleButtonProps = {
  clientId: string;
  // The nonce hash from Proxy. The raw value never leaves the server.
  nonceHash: string;
  // Picks Google's own label: sign in, sign up, or continue when linking.
  intent: "signin" | "signup" | "link";
  // The Server Action the credential is posted to: signing in, or linking.
  action: GoogleAction;
  // Where to go afterwards, forwarded by Proxy.
  next?: string;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}
